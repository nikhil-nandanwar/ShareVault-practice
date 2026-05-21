import axios, { AxiosError } from 'axios';
import { API_BASE_URL, ENDPOINTS } from '@/config/api';

const client = axios.create({ baseURL: API_BASE_URL });

interface ErrorResponse {
    error?: string;
}

export interface UploadResult {
    code: string;
}

export interface RetrievedTextContent {
    type: 'text';
    content: string;
}

export interface RetrievedFile {
    filename: string;
    relativePath?: string;
    size: number;
}

export interface RetrievedFilesContent {
    type: 'files';
    files: RetrievedFile[];
}

export type RetrievedContent = RetrievedTextContent | RetrievedFilesContent;

function extractError(error: unknown, fallback: string): string {
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ErrorResponse>;
        return axiosError.response?.data?.error || fallback;
    }
    return fallback;
}

export async function uploadText(content: string): Promise<UploadResult> {
    try {
        const { data } = await client.post<{ code: string }>(ENDPOINTS.UPLOAD_TEXT, { content });
        return { code: data.code };
    } catch (error) {
        throw new Error(extractError(error, 'Failed to upload text'));
    }
}

// Threshold above which the client switches to the chunked upload protocol.
// Below it, a single multipart POST is simpler and faster.
const CHUNKED_UPLOAD_THRESHOLD_BYTES = 8 * 1024 * 1024;
// Target chunk size. Must stay <= the backend's MAX_CHUNK_SIZE_MB cap (8 MB default).
const CHUNK_SIZE_BYTES = 8 * 1024 * 1024;

export interface UploadProgress {
    /** 0..1 fraction of total bytes uploaded across all files. */
    fraction: number;
    uploadedBytes: number;
    totalBytes: number;
}

export type UploadProgressCallback = (progress: UploadProgress) => void;

function getRelativePath(file: File): string {
    const withFallback = file as File & { __relativePath?: string };
    return file.webkitRelativePath || withFallback.__relativePath || '';
}

export async function uploadFiles(
    files: File[],
    onProgress?: UploadProgressCallback,
): Promise<UploadResult> {
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    const hasLargeFile = files.some((f) => f.size > CHUNKED_UPLOAD_THRESHOLD_BYTES);
    if (hasLargeFile || totalBytes > CHUNKED_UPLOAD_THRESHOLD_BYTES) {
        return uploadFilesChunked(files, onProgress);
    }
    return uploadFilesSingleShot(files, onProgress);
}

async function uploadFilesSingleShot(
    files: File[],
    onProgress?: UploadProgressCallback,
): Promise<UploadResult> {
    const formData = new FormData();
    // Send paths *before* files so they're parsed into req.body alongside the
    // uploaded file array on the backend. One `paths` entry per file, in order.
    files.forEach((file) => formData.append('paths', getRelativePath(file)));
    files.forEach((file) => formData.append('files', file));

    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);

    try {
        const { data } = await client.post<{ code: string }>(ENDPOINTS.UPLOAD_FILE, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            onUploadProgress: (evt) => {
                if (!onProgress) return;
                const loaded = evt.loaded ?? 0;
                const total = evt.total ?? totalBytes;
                onProgress({
                    fraction: total ? Math.min(1, loaded / total) : 0,
                    uploadedBytes: loaded,
                    totalBytes: total,
                });
            },
        });
        return { code: data.code };
    } catch (error) {
        throw new Error(extractError(error, 'Failed to upload files'));
    }
}

interface InitChunkSessionResponse {
    sessionId: string;
    files: Array<{ fileId: string; name: string }>;
    chunkSize: number;
}

async function uploadFilesChunked(
    files: File[],
    onProgress?: UploadProgressCallback,
): Promise<UploadResult> {
    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    const chunkSize = CHUNK_SIZE_BYTES;

    const initPayload = {
        files: files.map((file) => ({
            name: file.name,
            relativePath: getRelativePath(file),
            size: file.size,
            // Empty files still need exactly one chunk so we can record the upload.
            totalChunks: file.size === 0 ? 1 : Math.ceil(file.size / chunkSize),
            mimeType: file.type || 'application/octet-stream',
        })),
    };

    let initResponse: InitChunkSessionResponse;
    try {
        const { data } = await client.post<InitChunkSessionResponse>(
            ENDPOINTS.UPLOAD_INIT,
            initPayload,
        );
        initResponse = data;
    } catch (error) {
        throw new Error(extractError(error, 'Failed to start upload'));
    }

    const sessionId = initResponse.sessionId;
    // Track per-chunk bytes already counted so progress is monotonic even on
    // retried/duplicate chunks.
    let uploadedBytes = 0;
    const emitProgress = () => {
        if (!onProgress) return;
        onProgress({
            fraction: totalBytes ? Math.min(1, uploadedBytes / totalBytes) : 1,
            uploadedBytes,
            totalBytes,
        });
    };
    emitProgress();

    try {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileId = initResponse.files[i]?.fileId;
            if (!fileId) throw new Error('Server did not allocate a fileId');

            const totalChunks = file.size === 0 ? 1 : Math.ceil(file.size / chunkSize);
            for (let ci = 0; ci < totalChunks; ci++) {
                const start = ci * chunkSize;
                const end = Math.min(start + chunkSize, file.size);
                const blob = file.size === 0 ? new Blob([]) : file.slice(start, end);
                const chunkBytes = end - start;
                let counted = 0;

                await client.post(ENDPOINTS.UPLOAD_CHUNK(sessionId, fileId, ci), blob, {
                    headers: { 'Content-Type': 'application/octet-stream' },
                    // Browsers cap fetch/XHR upload sizes well above our chunk size,
                    // but axios's default limits are conservative — disable them.
                    maxBodyLength: Infinity,
                    maxContentLength: Infinity,
                    onUploadProgress: (evt) => {
                        if (!evt.loaded) return;
                        const delta = evt.loaded - counted;
                        if (delta <= 0) return;
                        counted = evt.loaded;
                        uploadedBytes += delta;
                        emitProgress();
                    },
                });

                // If onUploadProgress didn't fire for the whole chunk (some browsers
                // skip it for tiny payloads), reconcile against the known chunk size.
                if (counted < chunkBytes) {
                    uploadedBytes += chunkBytes - counted;
                    emitProgress();
                }
            }
        }

        const { data: finalizeData } = await client.post<{ code: string }>(
            ENDPOINTS.UPLOAD_FINALIZE(sessionId),
        );
        return { code: finalizeData.code };
    } catch (error) {
        // Best-effort cleanup so the server doesn't hold onto half-uploaded chunks.
        client.delete(ENDPOINTS.UPLOAD_ABORT(sessionId)).catch(() => {});
        throw new Error(extractError(error, 'Failed to upload files'));
    }
}

export async function getContent(code: string): Promise<RetrievedContent> {
    try {
        const { data } = await client.get<RetrievedContent>(ENDPOINTS.GET_CONTENT(code));
        return data;
    } catch (error) {
        throw new Error(extractError(error, 'Failed to retrieve content'));
    }
}

export async function downloadFile(
    code: string,
    fileIndex: number,
    fallbackName = 'downloaded-file',
): Promise<void> {
    try {
        const response = await client.get<Blob>(ENDPOINTS.DOWNLOAD_FILE(code, fileIndex), {
            responseType: 'blob',
        });

        const contentType = response.headers['content-type'];
        const blob = new Blob([response.data], {
            type: typeof contentType === 'string' ? contentType : undefined,
        });
        const url = window.URL.createObjectURL(blob);

        let downloadName = fallbackName;
        const rawDisposition = response.headers['content-disposition'];
        const contentDisposition = typeof rawDisposition === 'string' ? rawDisposition : undefined;
        if (contentDisposition) {
            const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (match && match[1]) {
                downloadName = match[1].replace(/['"]/g, '');
            }
        }

        // RFC 6266 filenames are percent-encoded; fall back to the raw name if decoding fails.
        let safeName = downloadName;
        try {
            safeName = decodeURIComponent(downloadName);
        } catch {
            safeName = downloadName;
        }

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', safeName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        throw new Error(extractError(error, 'Failed to download file. Please try again.'));
    }
}
