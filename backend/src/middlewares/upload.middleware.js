import multer from 'multer';
import { config } from '../config/env.js';
import { getStorage } from '../services/storage/index.js';

/**
 * Custom multer engine that delegates writes to the configured storage
 * abstraction. This keeps the route layer agnostic to disk/S3/etc., and the
 * multer File object carries `storageKey` instead of a hard-coded `path`.
 */
const storageEngine = {
    _handleFile(req, file, cb) {
        try {
            const storage = getStorage();
            const { key, stream, absolutePath } = storage.createWriteStream(file.originalname);

            let size = 0;
            file.stream.on('data', (chunk) => {
                size += chunk.length;
            });

            file.stream.on('error', (err) => cb(err));
            stream.on('error', (err) => cb(err));
            stream.on('finish', () => {
                cb(null, { storageKey: key, size, path: absolutePath });
            });

            file.stream.pipe(stream);
        } catch (err) {
            cb(err);
        }
    },

    _removeFile(_req, file, cb) {
        const storage = getStorage();
        Promise.resolve(storage.delete(file.storageKey))
            .then(() => cb(null))
            .catch(cb);
    },
};

export const upload = multer({
    storage: storageEngine,
    limits: {
        files: config.upload.maxFiles,
        fileSize: config.upload.maxFileSizeBytes,
        fieldNameSize: 200,
        fieldSize: 1024 * 100,
    },
});

export default upload;
