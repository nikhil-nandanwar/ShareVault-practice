'use client';

import { useMemo, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CodeDisplay,
    Icon,
} from '@/components/ui';
import FileDropZone from './FileDropZone';
import FilePreviewItem from './FilePreviewItem';
import { isFileAllowed } from '@/constants/fileTypes';
import { formatBytes } from '@/utils/formatBytes';
import { uploadFiles as uploadFilesApi } from '@/services/shareService';

function FileUploadSection() {
    const [files, setFiles] = useState<File[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedCode, setGeneratedCode] = useState('');

    const totalSize = useMemo(
        () => files.reduce((sum, file) => sum + file.size, 0),
        [files],
    );

    const handleFiles = (newFiles: File[]) => {
        const valid = newFiles.filter(isFileAllowed);
        if (valid.length === 0) {
            setError('Only image, video, audio, document, and ZIP files are supported.');
            return;
        }
        if (valid.length < newFiles.length) {
            setError('Some files were skipped because their type is not supported.');
        } else {
            setError('');
        }
        setFiles((prev) => [...prev, ...valid]);
        setGeneratedCode('');
    };

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        setGeneratedCode('');
    };

    const clearAll = () => {
        setFiles([]);
        setGeneratedCode('');
        setError('');
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            setError('Please add at least one file.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const { code } = await uploadFilesApi(files);
            setGeneratedCode(code);
            setFiles([]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to upload files');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section>
            <Card>
                <CardHeader>
                    <CardTitle>Share files</CardTitle>
                    <CardDescription>
                        Drop in files to bundle them under a single 4-digit code.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-5">
                    <FileDropZone onFiles={handleFiles} disabled={loading} />

                    {error && <Alert variant="error">{error}</Alert>}

                    {files.length > 0 && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-slate-700">
                                    {files.length} {files.length === 1 ? 'file' : 'files'} ·{' '}
                                    <span className="font-normal text-slate-500">
                                        {formatBytes(totalSize)}
                                    </span>
                                </h3>
                                <button
                                    type="button"
                                    onClick={clearAll}
                                    className="text-xs font-medium text-slate-500 transition-colors hover:text-rose-600"
                                >
                                    Clear all
                                </button>
                            </div>

                            <ul className="space-y-2">
                                {files.map((file, index) => (
                                    <FilePreviewItem
                                        key={`${file.name}-${index}`}
                                        file={file}
                                        onRemove={() => removeFile(index)}
                                    />
                                ))}
                            </ul>

                            <div className="flex justify-end pt-1">
                                <Button
                                    variant="brand"
                                    onClick={handleUpload}
                                    loading={loading}
                                    rightIcon={
                                        !loading ? (
                                            <Icon name="arrowRight" className="h-4 w-4" />
                                        ) : null
                                    }
                                >
                                    {loading
                                        ? 'Uploading…'
                                        : `Upload ${files.length} ${files.length === 1 ? 'file' : 'files'}`}
                                </Button>
                            </div>
                        </div>
                    )}

                    {generatedCode && (
                        <CodeDisplay
                            code={generatedCode}
                            helpText="Anyone with this code can download your files from the Retrieve tab."
                        />
                    )}
                </CardContent>
            </Card>
        </section>
    );
}

export default FileUploadSection;
