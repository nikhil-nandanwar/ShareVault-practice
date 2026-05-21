import { ok } from '../../../utils/ApiResponse.js';
import { isDatabaseReady } from '../../../config/database.js';
import { ApiError } from '../../../utils/ApiError.js';

const startedAt = Date.now();

export const healthController = {
    liveness(_req, res) {
        return ok(res, { status: 'ok', uptime: Math.floor((Date.now() - startedAt) / 1000) });
    },

    readiness(_req, res) {
        if (!isDatabaseReady()) {
            throw ApiError.serviceUnavailable('Database not ready');
        }
        return ok(res, { status: 'ready' });
    },
};

export default healthController;
