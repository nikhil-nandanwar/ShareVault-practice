'use client';

import {
    useEffect,
    useRef,
    useState,
    type DragEvent,
    type KeyboardEvent,
    type ChangeEvent,
    type MouseEvent,
} from 'react';
import { Icon } from '@/components/ui';
import { ACCEPT_ATTRIBUTE } from '@/constants/fileTypes';

export interface FileDropZoneProps {
    onFiles: (files: File[]) => void;
    disabled?: boolean;
}

function FileDropZone({ onFiles, disabled = false }: FileDropZoneProps) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const folderInputRef = useRef<HTMLInputElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // `webkitdirectory` is a non-standard attribute that React's typings don't
    // know about. Set it imperatively so we can keep type-safety elsewhere.
    useEffect(() => {
        const el = folderInputRef.current;
        if (!el) return;
        el.setAttribute('webkitdirectory', '');
        el.setAttribute('directory', '');
        el.setAttribute('mozdirectory', '');
    }, []);

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (disabled) return;
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (disabled) return;

        // Use the DataTransferItem API when available so dropped folders are
        // walked recursively. Falls back to dataTransfer.files for browsers
        // that don't expose webkitGetAsEntry (or for plain file drops).
        const items = Array.from(e.dataTransfer.items || []).filter(
            (i) => i.kind === 'file',
        );
        const haveEntryApi =
            items.length > 0 &&
            typeof (items[0] as DataTransferItem & {
                webkitGetAsEntry?: () => unknown;
            }).webkitGetAsEntry === 'function';

        if (haveEntryApi) {
            const collected: File[] = [];
            await Promise.all(
                items.map(async (item) => {
                    const entry = (
                        item as DataTransferItem & {
                            webkitGetAsEntry: () => FileSystemEntry | null;
                        }
                    ).webkitGetAsEntry();
                    if (entry) await walkEntry(entry, '', collected);
                }),
            );
            if (collected.length) {
                onFiles(collected);
                return;
            }
        }
        onFiles(Array.from(e.dataTransfer.files));
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) onFiles(Array.from(e.target.files));
        e.target.value = '';
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (!disabled) inputRef.current?.click();
        }
    };

    const openFolderPicker = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (!disabled) folderInputRef.current?.click();
    };

    return (
        <div
            role="button"
            tabIndex={0}
            aria-disabled={disabled}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !disabled && inputRef.current?.click()}
            onKeyDown={handleKeyDown}
            className={[
                'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-200',
                'focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20',
                disabled
                    ? 'cursor-not-allowed border-slate-200 bg-slate-50'
                    : 'cursor-pointer',
                isDragging
                    ? 'border-indigo-500 bg-indigo-50/60'
                    : 'border-slate-300 bg-slate-50/40 hover:border-indigo-400 hover:bg-indigo-50/40',
            ].join(' ')}
        >
            <input
                ref={inputRef}
                type="file"
                multiple
                accept={ACCEPT_ATTRIBUTE}
                onChange={handleChange}
                className="hidden"
                disabled={disabled}
            />
            <input
                ref={folderInputRef}
                type="file"
                multiple
                onChange={handleChange}
                className="hidden"
                disabled={disabled}
            />

            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200">
                <Icon name="upload" className="h-6 w-6" />
            </span>

            <div className="space-y-1">
                <p className="text-sm font-medium text-slate-800">
                    <span className="text-indigo-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-slate-500">
                    Files or whole folders — structure is preserved
                </p>
            </div>

            <button
                type="button"
                onClick={openFolderPicker}
                disabled={disabled}
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
                <Icon name="folder" className="h-3.5 w-3.5" />
                Upload a folder
            </button>
        </div>
    );
}

// Recursively walk a FileSystemEntry tree, populating `out` with `File`
// objects that carry a `webkitRelativePath` reflecting the folder layout.
async function walkEntry(
    entry: FileSystemEntry,
    prefix: string,
    out: File[],
): Promise<void> {
    if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        const file = await new Promise<File>((resolve, reject) =>
            fileEntry.file(resolve, reject),
        );
        // `webkitRelativePath` is read-only on File; redefine it so downstream
        // code reads the dropped path instead of an empty string.
        const relPath = prefix ? `${prefix}/${file.name}` : file.name;
        try {
            Object.defineProperty(file, 'webkitRelativePath', {
                value: relPath,
                configurable: true,
            });
        } catch {
            // Some browsers reject redefinition — fall back to attaching a
            // best-effort property so the upload layer can still see it.
            (file as File & { __relativePath?: string }).__relativePath = relPath;
        }
        out.push(file);
        return;
    }
    if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const reader = dirEntry.createReader();
        const readBatch = (): Promise<FileSystemEntry[]> =>
            new Promise((resolve, reject) => reader.readEntries(resolve, reject));
        const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
        // readEntries returns at most a page at a time; loop until empty.
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const batch = await readBatch();
            if (!batch.length) break;
            for (const child of batch) await walkEntry(child, nextPrefix, out);
        }
    }
}

export default FileDropZone;
