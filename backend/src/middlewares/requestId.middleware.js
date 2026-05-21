import { randomUUID } from 'node:crypto';

const HEADER = 'x-request-id';

export function requestIdMiddleware(req, res, next) {
    const incoming = req.get(HEADER);
    const id = incoming && /^[A-Za-z0-9._-]{8,128}$/.test(incoming) ? incoming : randomUUID();
    req.id = id;
    res.setHeader(HEADER, id);
    next();
}

export default requestIdMiddleware;
