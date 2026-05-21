import { randomInt } from 'node:crypto';
import { contentRepository } from '../repositories/content.repository.js';
import { ApiError } from '../utils/ApiError.js';
import {
    CODE_MIN,
    CODE_MAX,
    CODE_GENERATION_MAX_ATTEMPTS,
} from '../utils/constants.js';

/**
 * Generate a unique 4-digit code. We retry a bounded number of times rather
 * than looping forever — under high contention the caller gets a 503 instead
 * of a silently hung request. With 9,000 possible codes the active set must
 * stay well below saturation; widen CODE_MAX if traffic grows.
 */
export async function generateUniqueCode() {
    for (let attempt = 0; attempt < CODE_GENERATION_MAX_ATTEMPTS; attempt += 1) {
        const code = String(randomInt(CODE_MIN, CODE_MAX + 1));
        const exists = await contentRepository.existsByCode(code);
        if (!exists) return code;
    }
    throw ApiError.serviceUnavailable('Could not allocate a unique share code, please retry.');
}
