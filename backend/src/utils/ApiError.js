export class ApiError extends Error {
    constructor(statusCode, message, { code = 'ERROR', details, cause } = {}) {
        super(message, cause ? { cause } : undefined);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.expose = statusCode < 500;
        Error.captureStackTrace?.(this, this.constructor);
    }

    static badRequest(message = 'Bad request', opts) {
        return new ApiError(400, message, { code: 'BAD_REQUEST', ...opts });
    }
    static unauthorized(message = 'Unauthorized', opts) {
        return new ApiError(401, message, { code: 'UNAUTHORIZED', ...opts });
    }
    static forbidden(message = 'Forbidden', opts) {
        return new ApiError(403, message, { code: 'FORBIDDEN', ...opts });
    }
    static notFound(message = 'Not found', opts) {
        return new ApiError(404, message, { code: 'NOT_FOUND', ...opts });
    }
    static conflict(message = 'Conflict', opts) {
        return new ApiError(409, message, { code: 'CONFLICT', ...opts });
    }
    static payloadTooLarge(message = 'Payload too large', opts) {
        return new ApiError(413, message, { code: 'PAYLOAD_TOO_LARGE', ...opts });
    }
    static tooManyRequests(message = 'Too many requests', opts) {
        return new ApiError(429, message, { code: 'TOO_MANY_REQUESTS', ...opts });
    }
    static internal(message = 'Internal server error', opts) {
        return new ApiError(500, message, { code: 'INTERNAL_ERROR', ...opts });
    }
    static serviceUnavailable(message = 'Service unavailable', opts) {
        return new ApiError(503, message, { code: 'SERVICE_UNAVAILABLE', ...opts });
    }
}

export default ApiError;
