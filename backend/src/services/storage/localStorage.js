import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * Local-disk storage implementation. The public surface matches the
 * storage interface so swapping in S3/GCS later is a one-file change.
 *
 * Files are stored under: <root>/<YYYY>/<MM>/<DD>/<uuid>
 * Storing in date-sharded subdirectories prevents huge flat directories
 * that degrade lookup performance once the number of files grows.
 */
export class LocalStorage {
    constructor({ root }) {
        this.root = path.resolve(root);
    }

    async init() {
        await fsp.mkdir(this.root, { recursive: true });
    }

    #shardedPath(key) {
        return path.join(this.root, key);
    }

    #generateKey(originalName) {
        const now = new Date();
        const yyyy = String(now.getUTCFullYear());
        const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
        const dd = String(now.getUTCDate()).padStart(2, '0');
        const ext = path.extname(originalName || '').slice(0, 16);
        const safeExt = /^[.A-Za-z0-9_-]*$/.test(ext) ? ext : '';
        return path.posix.join(yyyy, mm, dd, `${randomUUID()}${safeExt}`);
    }

    /** Get a writable stream for a new object. Returns { key, stream, finalize }. */
    createWriteStream(originalName) {
        const key = this.#generateKey(originalName);
        const dest = this.#shardedPath(key);
        const dir = path.dirname(dest);
        fs.mkdirSync(dir, { recursive: true });
        const stream = fs.createWriteStream(dest);
        return { key, stream, absolutePath: dest };
    }

    async stat(key) {
        try {
            return await fsp.stat(this.#shardedPath(key));
        } catch (err) {
            if (err.code === 'ENOENT') return null;
            throw err;
        }
    }

    async exists(key) {
        return (await this.stat(key)) !== null;
    }

    createReadStream(key, options = {}) {
        return fs.createReadStream(this.#shardedPath(key), {
            highWaterMark: 64 * 1024,
            ...options,
        });
    }

    async delete(key) {
        try {
            await fsp.unlink(this.#shardedPath(key));
            return true;
        } catch (err) {
            if (err.code === 'ENOENT') return false;
            throw err;
        }
    }

    /** Remove every file under the storage root. Used by the admin purge endpoint. */
    async clear() {
        await fsp.rm(this.root, { recursive: true, force: true });
        await fsp.mkdir(this.root, { recursive: true });
    }
}

export default LocalStorage;
