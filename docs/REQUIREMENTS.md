# TaskFlow API — Requirements Specification
Version: 1.0 | Date: 2026-10-17 | Owner: You
Status: FINAL — You write all code, this doc is the contract.

## 1. Objective
Build TaskFlow API — a production-grade Node.js + TypeScript backend for team task management (mini Jira/Trello) in 30 days x 1hr/day (~30 hrs).
Interview goal: talk 15-20 mins on design, auth, caching, jobs, scaling.
No frontend. Test via Postman/Swagger. Deploy with public URL + GitHub link.

## 2. Constraints
1. 1 hr/day, 30 days. MVP first, stretch later.
2. You code everything. Must explain every line in interview.
3. Stack fixed (Sec 3). Don't switch mid-project.
4. Local: Node 24, Docker for Postgres + Redis.
5. Free deploy only: Render/Railway + Neon/Supabase + Upstash.
6. Daily commits on GitHub.

## 3. Tech Stack (Mandatory)
- Node 20+ + TypeScript 5 strict, Express 4
- PostgreSQL 16 + Prisma, Redis 7 + BullMQ
- bcryptjs + jsonwebtoken (access + refresh), zod validation
- multer (local disk, S3-ready abstraction)
- pino + pino-http, helmet, cors, express-rate-limit
- swagger-ui-express, Jest + Supertest + ts-jest
- Docker + compose, GitHub Actions, dotenv, ESLint + Prettier
Rule: TS strict, 0 lint errors, `npm run build` passes, no `any` without note.

## 4. Users & Roles
1. Member: register/login, create own projects, manage own tasks/comments.
2. Admin: all member powers + list all users, delete any project/task.
Rule: every private route needs JWT. Ownership check: only own resources unless ADMIN.

## 5. Scope
### 5.1 In Scope (MVP Must Build)
- Auth: register, login, refresh, logout, me
- Users: list (admin only)
- Projects: CRUD + pagination
- Tasks: CRUD + filter/sort/search/pagination + soft-delete + assign + status
- Comments: CRUD on tasks
- Attachments: single file per task (5MB max jpg/png/pdf) local storage
- Caching: Redis for GET tasks list, invalidate on write
- Jobs: welcome-email on register + overdue checker cron 1x/day
- Cross-cutting: validation, error handler, logging+request-id, rate-limit, health, Swagger, tests, Docker, CI, deploy

### 5.2 Out of Scope (Do NOT build)
Frontend, GraphQL, microservices, K8s, payments, real SMTP, real S3, WebSocket, OAuth.

### 5.3 Stretch (pick max 1-2 after MVP)
S1 presigned S3, S2 full-text search, S3 SSE updates, S4 Kanban state machine.

## 6. Functional Requirements
### FR-1 Auth
- FR-1.1 POST /api/v1/auth/register: name, email unique valid, password min8 letter+number. bcrypt 10 rounds. Return 201 + access+refresh. Enqueue welcome job.
- FR-1.2 POST /api/v1/auth/login: email+password. 401 invalid. Rate limit 10/15min/IP.
- FR-1.3 POST /api/v1/auth/refresh: valid refresh -> rotate both. Old blacklisted in Redis.
- FR-1.4 POST /api/v1/auth/logout [auth]: blacklist refresh.
- FR-1.5 GET /api/v1/auth/me [auth]: current user no passwordHash.
- FR-1.6 Never return passwords. Access 15m, refresh 7d.

### FR-2 Users
- FR-2.1 GET /api/v1/users?page&limit [auth+admin]: paginated, hide hash.

### FR-3 Projects
- FR-3.1 POST /api/v1/projects [auth]: {name 3-100 req, description max500}. Owner=me.
- FR-3.2 GET /api/v1/projects?page&limit&search [auth]: only mine (admin all). page1 limit10 max50. Search name.
- FR-3.3 GET /api/v1/projects/:id [auth+owner]
- FR-3.4 PATCH /api/v1/projects/:id [auth+owner] partial
- FR-3.5 DELETE /api/v1/projects/:id [auth+owner] cascade tasks+comments 204

### FR-4 Tasks
- FR-4.1 POST /api/v1/projects/:projectId/tasks [auth+owner]: {title 3-200 req, description?, status?=TODO, priority?=MEDIUM, dueDate? ISO future, assigneeId? must exist}.
- FR-4.2 GET /api/v1/projects/:projectId/tasks?status&priority&search&sortBy=createdAt|dueDate|priority&order&page&limit&includeDeleted=false [auth+owner+cached]: AND filters, search title+desc, exclude deleted default. Redis 60s key tasks:{projectId}:{queryhash}. Return X-Cache HIT|MISS.
- FR-4.3 GET /api/v1/tasks/:id [auth+owner via project]
- FR-4.4 PATCH /api/v1/tasks/:id [auth+owner]: allow status priority assign dueDate title desc. Invalidate cache.
- FR-4.5 DELETE /api/v1/tasks/:id [auth+owner]: soft isDeleted=true. ?hard=true ADMIN hard delete.
- FR-4.6 Overdue = dueDate<now AND status!=DONE AND !isDeleted. GET /api/v1/tasks/overdue [auth] own tasks.

### FR-5 Comments
- FR-5.1 POST /api/v1/tasks/:taskId/comments [auth+owner]: {body 1-1000 req}.
- FR-5.2 GET /api/v1/tasks/:taskId/comments?page&limit [auth+owner]
- FR-5.3 DELETE /api/v1/comments/:id [author or ADMIN]

### FR-6 Attachments
- FR-6.1 POST /api/v1/tasks/:taskId/attachments [auth+owner]: multipart field `file`, jpg/png/pdf only, 5MB max. Store /uploads cuid name. Save metadata.
- FR-6.2 GET /api/v1/tasks/:taskId/attachments [auth+owner] list metadata.
- FR-6.3 Serve GET /uploads/* static dev only. Document S3 path in README.

### FR-7 Jobs BullMQ + Redis
- FR-7.1 On register enqueue welcome-email (3 attempts backoff). Worker via Nodemailer Ethereal. Must not block response.
- FR-7.2 Repeatable overdue-check every 24h: log count. Manual POST /api/v1/admin/jobs/overdue-check [ADMIN].

### FR-8 Common
- FR-8.1 GET /health -> {status ok, uptime, db, redis}. GET /api/v1/health detailed.
- FR-8.2 List envelope {data:[], meta:{page,limit,total,totalPages}}.
- FR-8.3 Errors {success:false,message,errors?,requestId}. Codes 400 401 403 404 409 429 500.
- FR-8.4 X-Request-Id per request in logs + errors.
- FR-8.5 Swagger at /docs all endpoints + auth button. Postman /postman/taskflow.json.

## 7. API Table Must Implement
POST /api/v1/auth/register, POST /login, POST /refresh, POST /logout[auth], GET /me[auth], GET /users[admin]
POST /projects[auth], GET /projects[auth], GET /projects/:id[owner], PATCH /:id[owner], DELETE /:id[owner]
POST /projects/:projectId/tasks[owner], GET /projects/:projectId/tasks[owner+cached]
GET /tasks/overdue[auth], GET /tasks/:id[owner], PATCH /tasks/:id[owner], DELETE /tasks/:id[owner]
POST /tasks/:taskId/comments[owner], GET /tasks/:taskId/comments[owner], DELETE /comments/:id[author/admin]
POST /tasks/:taskId/attachments[owner], GET /tasks/:taskId/attachments[owner]
GET /health, GET /docs
Header Authorization: Bearer <accessToken>

## 8. Data Model Prisma Must Match
- User(id cuid, email unique, name, passwordHash, role ADMIN|MEMBER default MEMBER, timestamps)
- Project(id, name, description?, ownerId FK cascade, timestamps, index ownerId)
- Task(id, title, description?, status TODO|IN_PROGRESS|DONE default TODO, priority LOW|MEDIUM|HIGH default MEDIUM, dueDate?, isDeleted false, projectId FK cascade, assigneeId FK SetNull?, timestamps, indexes [projectId,status] [assigneeId] [dueDate])
- Comment(id, body, taskId FK cascade, authorId FK cascade, createdAt, index taskId)
Rules: delete project cascades tasks+comments. No hard delete except admin task hard.
Seed: 1 admin admin@taskflow.io/Admin123!, 2 members, 2 projects, 8 tasks mixed, 5 comments.

## 9. Validation & Business Rules
- All inputs zod before logic. Fail -> 400 field errors.
- email valid lowercase trimmed unique. password min8 letter+number explicit msg.
- name/project/task title trimmed min/max enforced.
- dueDate ISO valid. Create must be future. Update allow past only if DONE document.
- pagination page>=1 1<=limit<=50 defaults 1/10.
- file whitelist +5MB reject 400 clear msg.
- middleware order protect->validate->checkOwnership. Never trust client IDs.
- cache TTL60s key includes userId+projectId+query. Invalidate on POST/PATCH/DELETE.

## 10. Non-Functional
- NFR-1 Security: bcrypt10+, helmet, cors allowlist, rate-limit auth+global100/15min, no secrets in repo, JWT>=32chars, rotation+denylist, hide stack prod.
- NFR-2 Perf: p95 <200ms cached <500ms uncached 1000 tasks. Indexes Sec8. Avoid N+1 include. X-Cache header.
- NFR-3 Reliability: graceful shutdown SIGTERM, asyncHandler, job retries, health for Docker.
- NFR-4 Observability: pino JSON prod pretty dev. Log method url status duration requestId userId. No secrets in logs.
- NFR-5 Quality: TS strict ESLint0 Prettier layered routes->controller->service->db no Prisma in controllers ApiError asyncHandler. Max file 250 lines.
- NFR-6 Docs: README problem features stack diagram ERD setup env API caching auth scaling screenshots.

## 11. Folder Structure Follow
src/config/{env,db,redis,logger} middlewares/{auth,validate,error,rateLimit,upload,requestId}
modules/auth|projects|tasks|comments/{*.routes,*.controller,*.service,*.schema}
utils/{ApiError,asyncHandler,pagination,cache} jobs/{queues,workers} app.ts server.ts
prisma/{schema.prisma,seed.ts} tests/{auth.test,tasks.test,setup} uploads/.gitkeep
Dockerfile docker-compose.yml .github/workflows/ci.yml README REQUIREMENTS .env.example

## 12. Milestones 30Dx1hr in order
Wk1 Foundations+Auth:
D1 setup TS ESLint folders health logger git. DoD dev /health 200.
D2 docker pg Prisma schema Sec8 migrate+seed. DoD studio shows 4 tables.
D3 register/login bcrypt JWT protect. DoD Postman register-login-me.
D4 RBAC admin + zod + ApiError + handler. DoD 400/401/403 correct.
D5 Projects CRUD ownership pagination. DoD 5 endpoints Postman.
D6 Tasks CRUD filter search sort soft-delete. DoD ?status&search works.
D7 Swagger + Postman + README skeleton + push. DoD /docs loads.
Wk2 Advanced:
D8 Comments assign overdue. DoD author check.
D9 Uploads multer validation static. DoD 5MB+ rejected valid stored.
D10 Redis list invalidate X-Cache + login limit. DoD 2nd GET HIT POST clears.
D11 BullMQ workers Ethereal. DoD register enqueues worker log sent.
D12 helmet cors rotation denylist. DoD logout->refresh 401.
D13 Jest >=10 tests auth tasks RBAC. DoD npm test green coverage>60%.
D14 Dockerfile compose api+pg+redis .env.example. DoD compose up runs.
Wk3 Ship:
D15 CI lint+test+build badge. DoD green tick.
D16 Deploy Render+Neon+Upstash live URL README. DoD public /health 200.
D17 request-id shutdown logs. DoD logs show requestId.
D18 indexes N+1 fix perf notes. DoD README perf.
D19 ONE stretch S1-S4. DoD documented tested.
D20 README diagram ERD decisions API table. DoD stranger setup 5min.
D21 Buffer TODOs 2min Loom link.
Wk4 Interview:
D22 Scale notes LB replicas Redis cluster S3 CDN 1 page README.
D23 QA JWTvsSession rotation RBAC ACID N+1 eventloop middleware cache.
D24 Load k6/autocannon 100VUs screenshot README.
D25 Mock 5min pitch Problem Stack Schema Auth Hard Scale.
D26-30 Buffer apply freeze scope fix bugs only.
If behind cut D19 D24 first. Never cut D3-D7 D10-D14 D16 D20.

## 13. Testing DoD
- npm test passes fresh clone document test DB choice.
- Min10 tests: register ok/dup/invalid login ok/wrong me401 project201 listshape taskfilter RBAC403 validation400 softdel excluded.
- Coverage>60% services. No skips. CI runs on push.

## 14. DevOps Checklist
- docker compose pg+redis + migrate works
- cp .env.example .env + npm i + npm run dev documented
- Dockerfile multistage .dockerignore non-root note if skipped
- CI install lint test build
- Deploy live env set logs clean, no secrets committed

## 15. README Must Have
1 pitch+live+Swagger 2 features+badges+CI 3 quickstart5cmds+env 4 diagram+flow 5 ERD+auth rotation diagram 6 API table+Postman 7 decisions Prisma BullMQ softdel S3 8 scaling 1M 5bullets 9 screenshots Swagger Docker CI load.

## 16. Interview Qs Must Answer
1 JWT access refresh why stored rotation logout? 2 RBAC ownership order? 3 cache key TTL invalidation stampede? 4 N+1 Prisma avoid? 5 soft vs hard? 6 BullMQ retry Redis down? 7 rate-limit algo why login? 8 pagination offset vs cursor? 9 ACID cascades? 10 eventloop why Node what blocks? 11 scale 1M replicas cache queue S3? 12 hardest bug story ready.

## 17. Final Acceptance DONE=all Yes
- All Sec7 endpoints work deployed prove screenshots
- Auth RBAC validation error shape correct
- Redis HIT MISS invalidation proven, jobs non-blocking
- Tests+CI+Ddocker+live green
- README Sec15 + Swagger + Postman committed
- Can whiteboard schema auth scale without notes
Rule: not in README+Swagger+tests = doesnt exist.
Build one thing well. Push daily.
