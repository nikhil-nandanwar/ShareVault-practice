import rateLimit from 'express-rate-limit';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

function build({ max, windowMs, name }) {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { success: false, error: { code: 'TOO_MANY_REQUESTS', message: `Rate limit exceeded (${name})` } },
        handler: (_req, _res, next) => {
            next(ApiError.tooManyRequests(`Rate limit exceeded (${name})`));
        },
    });
}

export const globalRateLimiter = build({
    max: config.rateLimit.max,
    windowMs: config.rateLimit.windowMs,
    name: 'global',
});

export const uploadRateLimiter = build({
    max: config.rateLimit.uploadMax,
    windowMs: config.rateLimit.windowMs,
    name: 'upload',
});
