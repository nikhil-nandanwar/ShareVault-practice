import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

function build({ max, windowMs, name, skip }) {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: `Rate limit exceeded (${name})` } },
        handler: (_req, _res, next) => {
            next(ApiError.tooManyRequests(`Rate limit exceeded (${name})`));
        },
        ...(skip ? { skip } : {}),
    });
}

// Chunked uploads issue hundreds of requests per file by design. Counting each
// chunk against the global per-IP cap would block any sizeable upload, so we
// exempt the chunk route here and let the per-chunk size/session checks act
// as the abuse guardrail instead.
const isChunkRoute = (req) => /\/upload\/chunk\//.test(req.path);

export const globalRateLimiter = build({
    max: config.rateLimit.max,
    windowMs: config.rateLimit.windowMs,
    name: 'global',
    skip: isChunkRoute,
});

export const uploadRateLimiter = build({
    max: config.rateLimit.uploadMax,
    windowMs: config.rateLimit.windowMs,
    name: 'upload',
});
