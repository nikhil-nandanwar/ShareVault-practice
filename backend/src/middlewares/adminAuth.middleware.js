import { timingSafeEqual } from 'node:crypto';
import { config } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Gate destructive admin endpoints behind a shared secret. If ADMIN_TOKEN is
 * not configured the endpoint is closed by default rather than open — the
 * legacy /api/delete-all was reachable by anyone, which is a serious risk.
 */
export function adminAuth(req, _res, next) {
    if (!config.admin.token) return next(ApiError.forbidden('Admin endpoints disabled'));

    const provided = req.get('x-admin-token') || req.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!provided) return next(ApiError.unauthorized('Missing admin token'));

    const a = Buffer.from(provided);
    const b = Buffer.from(config.admin.token);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
        return next(ApiError.unauthorized('Invalid admin token'));
    }
    return next();
}

export default adminAuth;
