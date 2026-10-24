# Postgres Bridge — For MySQL + Mongo Devs (Learn While Building TaskFlow)
Why Postgres for interviews: Most Node backend roles ask Postgres + Prisma. MySQL knowledge transfers 90%. Mongo thinking helps with JSONB. You don't need to master DBA stuff — just CRUD + joins + indexes.

## MySQL -> Postgres: Almost Same
- `AUTO_INCREMENT` -> `SERIAL` or Prisma `@default(cuid())` / `@default(uuid())` (TaskFlow uses cuid, no ints)
- backticks `` ` `` -> double quotes `"` or no quotes. `LIMIT 10 OFFSET 20` same.
- `SHOW TABLES;` -> `\dt` in psql. `DESCRIBE users;` -> `\d users`
- Enums: MySQL ENUM() -> Postgres native ENUM (Prisma handles: Role, TaskStatus, Priority)
- Boolean: MySQL tinyint(1) -> Postgres real BOOLEAN (isDeleted Boolean)
- Timestamps: same, but Postgres prefers `timestamptz`. Prisma DateTime = ok.
- Foreign keys + ON DELETE CASCADE same syntax, Prisma does it via schema.

## Mongo -> Postgres: Mental Map
- Database -> Database, Collection -> Table, Document -> Row
- `_id: ObjectId` -> `id: cuid()` string (TaskFlow) — same idea, unique string id
- Embedded subdoc (comments inside task) -> Separate table + JOIN (Comment table + taskId FK). Postgres JOIN replaces $lookup.
- `db.tasks.find({status:"TODO"})` -> `WHERE status='TODO'` or Prisma `where:{status:"TODO"}`
- Flexible schema -> Strict schema (Prisma schema.prisma IS your Mongoose schema, but enforced by DB)
- Advantage: ACID joins + Prisma include = no N+1, strong consistency for tasks/projects.

## You Learn 5 Queries Only (Rest = Prisma)
1. Check tables: `\dt` 2. Describe: `\d "Task"` 3. Count: `SELECT count(*) FROM "Task";`
4. Filter: `SELECT id,title,status FROM "Task" WHERE status='TODO' LIMIT 10;`
5. Join: `SELECT t.title,u.email FROM "Task" t JOIN "User" u ON u.id=t."assigneeId" LIMIT 10;`
Prisma maps: `prisma.task.findMany({where:{status:"TODO"}})` = query 4. `include:{assignee:true}` = query 5. That's it.

## Docker Survival (D2 Setup — Copy Paste)
```
docker compose up -d postgres redis
docker ps
docker logs taskflow-pg --tail 20
npx prisma migrate dev --name init
npx prisma studio  # GUI like phpMyAdmin / Mongo Compass — use this daily
npx prisma seed (or tsx prisma/seed.ts)
```
If port 5432 busy (MySQL?): change to "5433:5432" in compose + DATABASE_URL port 5433.

## psql 1-Minute Crash
```
docker exec -it taskflow-pg psql -U taskflow -d taskflow
\l (list dbs) \dt (tables) \d "User" (schema) SELECT * FROM "User" LIMIT 5; \q (quit)
```
GUI alt: DBeaver / TablePlus / Prisma Studio — pick Prisma Studio for now, zero learning curve.

## 7-Day Postgres Micro-Plan (1hr/day, Fits TaskFlow)
D1 (30min extra): Install Docker + run `docker compose up -d`. Open Prisma Studio. Compare to phpMyAdmin/Compass. Done.
D2 (main DB day): Learn schema.prisma = Mongoose schema. Fields, @unique, @relation, onDelete Cascade/SetNull. Run migrate. Break it once: change field, migrate, see SQL in migrations/ folder. Read that SQL — best teacher.
D3-4: While building auth: `email String @unique` -> try duplicate register -> see P2002 error -> handle 409. That's Postgres unique constraint lesson.
D5-6: While building Tasks: `@@index([projectId,status])` -> run EXPLAIN: `EXPLAIN ANALYZE SELECT * FROM "Task" WHERE "projectId"='x' AND status='TODO';` See Index Scan vs Seq Scan. Learn why indexes matter.
D10: Redis day — same idea: cache invalidation has nothing to do with Postgres. Relax.
D18: Perf day: Fix N+1: bad = for loop findUnique, good = findMany include. Log queries with `// datasource + log:['query']` for 10 mins.

## Gotchas From MySQL/Mongo Devs
1. Case: `"Task"` quoted! `SELECT * FROM Task` fails, use `"Task"`. Prisma hides this, raw SQL doesn't.
2. cuid ids are strings, not ints — don't do `WHERE id=1`, use `'ck...'`.
3. `$` in password in DATABASE_URL must be URL-encoded (%24) or Docker connect fails.
4. Deleting User cascades Projects? Decide once in schema (onDelete:Cascade) — interview loves this Q.
5. Soft-delete (isDeleted) is app logic, not DB — always add `where:{isDeleted:false}` or you leak deleted tasks.

## Interview Lines (Say These)
- "I chose Postgres over Mongo because tasks need ACID joins + ownership constraints — Mongo embedding would duplicate or need $lookup."
- "Prisma generates parameterized queries, prevents injection, migrations versioned like git."
- "I added composite index [projectId,status] after EXPLAIN showed seq scan on task list."
- "Cascades ensure deleting a project cleans tasks/comments atomically."

You already know 80% via MySQL. Postgres = MySQL + better JSON + better enums. Build TaskFlow, you'll learn it.
