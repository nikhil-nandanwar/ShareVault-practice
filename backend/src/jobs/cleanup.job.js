import { config } from '../config/env.js';
import { logger } from '../config/logger.js';
import { contentRepository } from '../repositories/content.repository.js';
import { getStorage } from '../services/storage/index.js';

let timer = null;
let running = false;

/**
 * Sweep expired records. Mongo TTL indexes already delete documents in the
 * background, but they leave behind file-blobs on disk — this job catches the
 * orphans, runs in batches, and is safe to call concurrently (re-entrancy is
 * guarded by `running`).
 */
async function runCleanupOnce() {
    if (running) return;
    running = true;

    const storage = getStorage();
    let totalDocs = 0;
    let totalFiles = 0;

    try {
        // Iterate in batches so a huge backlog doesn't blow up memory.
        for (let i = 0; i < 20; i += 1) {
            const expired = await contentRepository.findExpiredBatch(500);
            if (expired.length === 0) break;

            const fileKeys = expired.flatMap((doc) => (doc.files || []).map((f) => f.storageKey));

            const results = await Promise.allSettled(fileKeys.map((k) => storage.delete(k)));
            totalFiles += results.filter((r) => r.status === 'fulfilled' && r.value).length;

            const ids = expired.map((d) => d._id);
            const { deletedCount = 0 } = await contentRepository.deleteByIds(ids);
            totalDocs += deletedCount;
        }

        if (totalDocs || totalFiles) {
            logger.info({ totalDocs, totalFiles }, 'Cleanup sweep complete');
        }
    } catch (err) {
        logger.error({ err }, 'Cleanup sweep failed');
    } finally {
        running = false;
    }
}

export function startCleanupJob() {
    if (timer) return;
    const interval = config.content.cleanupIntervalMs;
    timer = setInterval(runCleanupOnce, interval);
    timer.unref();
    logger.info({ intervalMs: interval }, 'Cleanup job scheduled');
    // Kick off one run shortly after boot so we don't wait a full interval.
    setTimeout(runCleanupOnce, 30_000).unref();
}

export function stopCleanupJob() {
    if (timer) {
        clearInterval(timer);
        timer = null;
    }
}

export { runCleanupOnce };
