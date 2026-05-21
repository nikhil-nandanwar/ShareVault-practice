import { ApiError } from '../utils/ApiError.js';

export function notFoundMiddleware(req, _res, next) {
    next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

export default notFoundMiddleware;
