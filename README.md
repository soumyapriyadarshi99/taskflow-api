# TaskFlow API

TaskFlow is a **team task-management backend** (mini Jira/Trello) built as a REST API. Teams register, create projects, add tasks, assign work, comment, and upload files — with secure JWT login, fast paginated lists, Redis caching, and background email jobs. No frontend; Postman/Swagger is the UI.

## What it does

- **Auth**: register/login with bcrypt-hashed passwords, JWT access (15m) + refresh (7d) with rotation and Redis denylist, logout.
- **Users**: admin-only paginated user list.
- **Projects**: CRUD with ownership (members see only their own; admins see all). Deleting a project cascades to its tasks/comments.
- **Tasks**: CRUD, status/priority/assignee/due-date, soft delete (`isDeleted`), overdue detection, filter/sort/search/pagination. Cached in Redis.
- **Comments**: CRUD on tasks, author-or-admin delete.
- **Attachments**: single file per request (jpg/png/pdf, 5MB max) stored on disk under `/uploads`, metadata in DB.
- **Jobs**: BullMQ welcome-email on register; daily overdue-check cron.
- **Cross-cutting**: zod validation, central error handler, request-id logging, rate limiting, health checks, Swagger docs, tests, Docker, CI.

## Tech stack

Node 20+ · TypeScript 5 (strict) · Express 4 · PostgreSQL 16 · Prisma · Redis 7 · BullMQ · bcryptjs · jsonwebtoken · zod · multer · pino · helmet · cors · express-rate-limit · swagger-ui-express · Jest + Supertest · Docker · GitHub Actions.

## Quick start

```bash
cp .env.example .env
docker compose up -d postgres redis
npm install
npx prisma migrate dev
npm run dev
```

- Health: `GET http://localhost:8000/health`
- Swagger: `http://localhost:8000/docs`

## Environment variables

| Var | Example |
|---|---|
| `PORT` | `8000` |
| `DATABASE_URL` | `postgresql://taskflow:taskflow123@localhost:5432/taskflow?schema=public` |
| `REDIS_URL` | `redis://localhost:6379` |
| `JWT_ACCESS_SECRET` | 32+ chars |
| `JWT_REFRESH_SECRET` | 32+ chars |

## API (prefix `/api/v1`)

| Method | Path | Auth |
|---|---|---|
| POST | /auth/register | public |
| POST | /auth/login | public |
| POST | /auth/refresh | public |
| POST | /auth/logout | auth |
| GET | /auth/me | auth |
| GET | /users | admin |
| POST | /projects | auth |
| GET | /projects | auth |
| GET/PATCH/DELETE | /projects/:id | owner |
| POST | /projects/:projectId/tasks | owner |
| GET | /projects/:projectId/tasks | owner (cached) |
| GET | /tasks/overdue | auth |
| GET/PATCH/DELETE | /tasks/:id | owner |
| POST/GET | /tasks/:taskId/comments | owner |
| DELETE | /comments/:id | author/admin |
| POST/GET | /tasks/:taskId/attachments | owner |

List endpoints return `{ data: [...], meta: { page, limit, total, totalPages } }`. Errors: `{ success: false, message, requestId }`.

## Data model

Entities: **User**, **Project**, **Task**, **Comment**, **Attachment**.

- IDs: `cuid()` strings.
- Roles: `MEMBER` (default) / `ADMIN`.
- Task status: `TODO` → `IN_PROGRESS` → `DONE`; priority `LOW/MEDIUM/HIGH`.
- Soft delete on Task via `isDeleted`.
- Cascade rules: deleting a project removes its tasks/comments/attachments; deleting a user removes owned projects/comments and unassigns tasks.

Indexes: `Project(ownerId)`, `Task(projectId,status)`, `Task(projectId,isDeleted)`, `Task(assigneeId)`, `Task(dueDate)`, `Comment(taskId)`, `Attachment(taskId)`.

## Caching

Redis caches `GET /projects/:id/tasks` for 60s under key `tasks:{projectId}:{userId}:{queryHash}`. Returns `X-Cache: HIT|MISS`. Invalidated on any task write (POST/PATCH/DELETE).

## Background jobs (BullMQ)

- `welcome-email` enqueued on register (3 retries with backoff), sent via Ethereal.
- `overdue-check` repeatable every 24h (logs count); manual trigger `POST /api/v1/admin/jobs/overdue-check` (admin).

## Run with Docker

```bash
docker compose up -d
```

Starts `postgres` (5432) and `redis` (6379). Run migrations separately: `npx prisma migrate deploy`.

## Tests

```bash
npm test
```

Jest + Supertest + ts-jest. Coverage target >60% on services. CI runs lint + test + build on push.

## Project layout

```
src/
  config/        env, db, redis, logger
  middlewares/   auth, validate, error, rateLimit, upload, requestId
  modules/       auth, projects, tasks, comments, attachments
  utils/         ApiError, asyncHandler, pagination, cache
  jobs/          queues, workers
  app.ts server.ts
prisma/          schema.prisma, seed.ts, migrations
tests/           auth.test, tasks.test, setup
uploads/         .gitkeep
```

## License

ISC
EOF\necho done