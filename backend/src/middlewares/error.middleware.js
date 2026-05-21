import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';
import { config } from '../config/env.js';

function toApiError(err) {
    if (err instanceof ApiError) return err;

    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return ApiError.payloadTooLarge('File exceeds maximum allowed size');
        }
        if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
            return ApiError.badRequest('Too many files in upload');
        }
        return ApiError.badRequest(`Upload error: ${err.message}`);
    }

    if (err?.name === 'ValidationError' && err?.isJoi) {
        return ApiError.badRequest('Request validation failed', {
            details: err.details?.map((d) => ({ path: d.path, message: d.message })),
        });
    }

    if (err?.name === 'CastError') {
        return ApiError.badRequest('Invalid identifier');
    }

    if (err?.code === 11000) {
        return ApiError.conflict('Duplicate resource');
    }

    if (err?.type === 'entity.too.large') {
        return ApiError.payloadTooLarge('Request body too large');
    }

    return ApiError.internal('Internal server error', { cause: err });
}

// eslint-disable-next-line no-unused-vars
export function errorMiddleware(err, req, res, _next) {
    const apiErr = toApiError(err);

    const logPayload = {
        err,
        statusCode: apiErr.statusCode,
        code: apiErr.code,
        method: req.method,
        url: req.originalUrl,
        requestId: req.id,
    };

    if (apiErr.statusCode >= 500) {
        logger.error(logPayload, apiErr.message);
    } else {
        logger.warn(logPayload, apiErr.message);
    }

    if (res.headersSent) {
        res.destroy(err);
        return;
    }

    res.status(apiErr.statusCode).json({
        success: false,
        error: {
            code: apiErr.code,
            message: apiErr.expose || !config.isProd ? apiErr.message : 'Internal server error',
            ...(apiErr.details ? { details: apiErr.details } : {}),
            ...(req.id ? { requestId: req.id } : {}),
        },
    });
}

export default errorMiddleware;
