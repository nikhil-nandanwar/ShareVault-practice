# ShareVault Backend

Production-grade Express + MongoDB API for code-based text & file sharing.

## Architecture

Layered, dependency-flowing-inward:

```
src/
├── server.js                  # Process entry: boot, graceful shutdown, signals
├── app.js                     # Express wiring: middleware order + route mount
├── config/
│   ├── env.js                 # Joi-validated env -> frozen config object
│   ├── logger.js              # Pino structured logger (JSON in prod, pretty in dev)
│   └── database.js            # Mongoose connection w/ pool tuning + lifecycle events
├── api/v1/
│   ├── routes/                # Thin routers, validation + handler composition
│   ├── controllers/           # Pull from req, call services, format response
│   └── validators/            # Joi schemas per endpoint
├── middlewares/
│   ├── requestId / requestLogger    # Correlation IDs + structured access logs
│   ├── rateLimit                    # Global + upload-specific limiters
│   ├── validate                     # Joi body/params/query validator
│   ├── upload                       # Multer engine that delegates to storage svc
│   ├── adminAuth                    # timing-safe token check for destructive ops
│   ├── notFound / error             # 404 + centralized error normalization
├── services/
│   ├── content.service.js     # Business logic (create, fetch, purge, serialize)
│   ├── code.service.js        # Crypto-strong unique-code allocator
│   └── storage/
│       ├── index.js           # Factory — swap impls without touching callers
│       └── localStorage.js    # Date-sharded disk impl (replaceable with S3/GCS)
├── repositories/              # Mongo data-access layer (the only file that knows Mongoose queries)
├── models/                    # Mongoose schemas + indexes + TTL
├── jobs/cleanup.job.js        # In-process orphan-file sweeper
└── utils/                     # ApiError, ApiResponse, asyncHandler, constants
```

The dependency rule: routes → controllers → services → repositories → models. Lower layers never import upper ones. This is what keeps it testable and replaceable.

## Production hardening

| Concern | Mechanism |
| --- | --- |
| HTTP headers | `helmet` |
| CORS | Explicit allowlist from `FRONTEND_URI` (comma-separated) |
| Payload limits | `express.json({ limit: '1mb' })`, per-file `MAX_FILE_SIZE_MB`, `MAX_FILES_PER_UPLOAD` |
| Rate limiting | `express-rate-limit` — global + stricter upload limiter |
| Injection | `express-mongo-sanitize` (NoSQL), `hpp` (param pollution), Joi on every input |
| Auth on destructive ops | `x-admin-token` timing-safe compare; endpoint disabled if no token set |
| Secrets in logs | Pino redact list (`authorization`, `cookie`, `x-admin-token`, `*.password`, `*.token`) |
| Graceful shutdown | SIGINT/SIGTERM → drain HTTP → stop job → close Mongo, 15s timeout |
| Observability | Structured JSON logs + correlation ID (`x-request-id`) propagated end-to-end |
| Health checks | `GET /healthz` (liveness), `GET /readyz` (Mongo readiness) |
| Connection pooling | `MONGO_POOL_SIZE` (default 50), socket + selection timeouts |
| Crash recovery | `uncaughtException` / `unhandledRejection` → log + graceful shutdown |
| File storage scale | Date-sharded paths (`YYYY/MM/DD/<uuid>`); abstract interface ready for S3 |
| Orphan cleanup | In-process sweep (no self-fetch); batched; re-entrancy guarded |
| Proxy awareness | `TRUST_PROXY` env, drives correct client-IP for rate limiting |
| Container runtime | Multi-stage Dockerfile, non-root user, volume-mounted uploads, healthcheck |

## API

All responses are `{ success: boolean, data?: ..., error?: { code, message, details?, requestId? } }`.

### Public

| Method | Path | Body / Params | Notes |
| --- | --- | --- | --- |
| `POST` | `/api/v1/upload/text` | `{ content: string }` | Returns `{ code, createdAt }`. Rate-limited. |
| `POST` | `/api/v1/upload/file` | `multipart/form-data` field `files` | Returns `{ code, fileCount, createdAt }`. Rate-limited. |
| `GET` | `/api/v1/content/:code` | `code: 4-digit string` | Returns content metadata. |
| `GET` | `/api/v1/download/:code/:fileIndex` | `code`, `fileIndex` | Streams file with `Content-Disposition`. |
| `GET` | `/api/v1/hello` | — | Sanity check. |
| `GET` | `/healthz` | — | Liveness. Always 200 if process is up. |
| `GET` | `/readyz` | — | Readiness. 503 if Mongo not connected. |

`/api/...` is also accepted as an alias for `/api/v1/...` for backward compatibility with the existing frontend.

### Admin (requires `ADMIN_TOKEN`)

| Method | Path | Header | Purpose |
| --- | --- | --- | --- |
| `DELETE` | `/api/v1/admin/purge-all` | `x-admin-token: <token>` | Deletes every record + all files. Refuses if token not configured. |

## Running

### Locally

```bash
cp .env.example .env
# edit MONGO_URI, FRONTEND_URI
npm install
npm run dev
```

### Docker (with Mongo)

```bash
docker compose up --build
```

## Configuration

All settings come from environment variables and are validated at boot — invalid values cause the process to exit with a clear message rather than fail at runtime. See `.env.example` for the full list.

## Scaling notes

- **Horizontal**: stateless API; behind a load balancer set `TRUST_PROXY=<hops>` so rate limits see the real client IP. When scaling out, replace `LocalStorage` with an S3 implementation behind the same interface — no other code changes needed.
- **Mongo**: tune `MONGO_POOL_SIZE` to `~2 * peak concurrent requests / pod`. The TTL index on `createdAt` plus the cleanup job covers expiry.
- **Code space**: 4-digit codes give 9,000 slots. With a 24h TTL that supports tens of thousands of uploads/day; widen `CODE_MIN`/`CODE_MAX` in `utils/constants.js` if traffic grows.
- **Logs**: emit JSON in production and ship via the container runtime (no file writes from the app).
