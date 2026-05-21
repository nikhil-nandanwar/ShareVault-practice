import { ApiError } from '../utils/ApiError.js';

export const validate = (schemas) => (req, _res, next) => {
    for (const key of ['body', 'params', 'query']) {
        const schema = schemas[key];
        if (!schema) continue;
        const { value, error } = schema.validate(req[key], {
            abortEarly: false,
            stripUnknown: true,
            convert: true,
        });
        if (error) {
            return next(
                ApiError.badRequest('Request validation failed', {
                    details: error.details.map((d) => ({ path: d.path.join('.'), message: d.message })),
                }),
            );
        }
        req[key] = value;
    }
    return next();
};

export default validate;
