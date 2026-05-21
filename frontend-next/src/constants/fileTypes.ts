export type FileCategory = 'image' | 'video' | 'audio' | 'document' | 'archive';

export const ALLOWED_FILE_TYPES: Record<FileCategory, string[]> = {
    image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.tiff', '.tif', '.ico', '.heic', '.heif'],
    video: ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv', '.wmv', '.3gp', '.m4v'],
    audio: ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.wma', '.aiff'],
    document: [
        // Word / text
        '.pdf', '.doc', '.docx', '.docm', '.docb', '.dot', '.dotx', '.dotm',
        '.txt', '.rtf', '.odt', '.ott', '.fodt', '.md', '.csv', '.xml', '.json',
        '.wps', '.wpt',                                      // WPS Writer
        '.pages',                                            // Apple Pages
        '.epub',
        // Excel / spreadsheets
        '.xls', '.xlsx', '.xlsm', '.xlsb', '.xlw',
        '.xlt', '.xltx', '.xltm', '.xla', '.xlam',
        '.ods', '.ots', '.fods',                             // OpenDocument
        '.et', '.ett',                                       // WPS Spreadsheet
        '.numbers',                                          // Apple Numbers
        // PowerPoint / presentations
        '.ppt', '.pptx', '.pptm',
        '.ppsx', '.ppsm', '.pps',
        '.pot', '.potx', '.potm',
        '.odp', '.otp', '.fodp',                             // OpenDocument
        '.dps', '.dpt', '.wpp',                              // WPS Presentation
        '.key',                                              // Apple Keynote
    ],
    archive: [
        // Common archives
        '.zip', '.zipx', '.rar', '.7z', '.7zip',
        // Tarballs and their combined-compression flavors
        '.tar', '.tgz', '.tbz', '.tbz2', '.txz', '.tlz', '.tzst', '.tzo',
        // Single-file compressors
        '.gz', '.gzip', '.bz', '.bz2', '.bzip2', '.xz', '.lz', '.lzma',
        '.lzo', '.zst', '.zstd', '.z', '.lha', '.lzh', '.cab', '.arj',
        '.ace', '.uue', '.cpio', '.iso',
        // Package / installer archives
        '.dmg', '.deb', '.rpm', '.pkg', '.apk', '.xapk', '.ipa',
        '.msi', '.msix', '.appx', '.appxbundle',
        '.jar', '.war', '.ear',
    ],
};

export const ALL_ALLOWED_EXTENSIONS = Object.values(ALLOWED_FILE_TYPES).flat();

export const ACCEPT_ATTRIBUTE = ALL_ALLOWED_EXTENSIONS.join(',');

export function getFileExtension(file: File): string {
    const lastDot = file.name.lastIndexOf('.');
    if (lastDot < 0 || lastDot === file.name.length - 1) return '';
    return file.name.slice(lastDot).toLowerCase();
}

export function getFileCategory(file: File): FileCategory {
    const ext = getFileExtension(file);
    for (const [category, extensions] of Object.entries(ALLOWED_FILE_TYPES) as [FileCategory, string[]][]) {
        if (extensions.includes(ext)) return category;
    }
    return 'document';
}

export function isFileAllowed(file: File): boolean {
    return ALL_ALLOWED_EXTENSIONS.includes(getFileExtension(file));
}
