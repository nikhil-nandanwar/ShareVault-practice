export function ok(res, data = null, meta) {
    return res.status(200).json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function created(res, data = null, meta) {
    return res.status(201).json({ success: true, data, ...(meta ? { meta } : {}) });
}

export function noContent(res) {
    return res.status(204).end();
}
