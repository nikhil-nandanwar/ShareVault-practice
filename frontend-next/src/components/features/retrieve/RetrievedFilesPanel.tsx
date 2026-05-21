'use client';

import { useState } from 'react';
import { Button, Icon } from '@/components/ui';
import { formatBytes } from '@/utils/formatBytes';
import { downloadFile } from '@/services/shareService';
import type { RetrievedFile } from '@/services/shareService';

export interface RetrievedFilesPanelProps {
    code: string;
    files: RetrievedFile[];
    onError?: (message: string) => void;
}

function RetrievedFilesPanel({ code, files, onError }: RetrievedFilesPanelProps) {
    const [downloadingIndex, setDownloadingIndex] = useState<number | null>(null);

    const handleDownload = async (index: number, filename: string) => {
        setDownloadingIndex(index);
        try {
            await downloadFile(code, index, filename);
        } catch (err) {
            onError?.(err instanceof Error ? err.message : 'Failed to download file. Please try again.');
        } finally {
            setDownloadingIndex(null);
        }
    };

    if (!files?.length) return null;

    return (
        <ul className="space-y-2">
            {files.map((file, index) => {
                const relativePath = file.relativePath || '';
                const folderPath =
                    relativePath && relativePath.includes('/')
                        ? relativePath.slice(0, relativePath.lastIndexOf('/'))
                        : '';
                return (
                    <li
                        key={index}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                                <Icon
                                    name={folderPath ? 'folder' : 'file'}
                                    className="h-5 w-5"
                                />
                            </span>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-slate-800">
                                    {file.filename}
                                </p>
                                {folderPath && (
                                    <p
                                        className="truncate text-xs text-indigo-600"
                                        title={folderPath}
                                    >
                                        {folderPath}/
                                    </p>
                                )}
                                <p className="text-xs text-slate-500">
                                    {formatBytes(file.size)}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleDownload(index, file.filename)}
                            loading={downloadingIndex === index}
                            leftIcon={
                                downloadingIndex === index ? null : (
                                    <Icon name="download" className="h-4 w-4" />
                                )
                            }
                        >
                            Download
                        </Button>
                    </li>
                );
            })}
        </ul>
    );
}

export default RetrievedFilesPanel;
