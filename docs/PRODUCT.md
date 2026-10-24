# TaskFlow — What Are We Building? (Read This First)

> Mini Jira / Trello — backend only. No UI. Postman is your UI.

## 1. One-line idea
A REST API where teams register, create projects, add tasks, assign work, comment and upload files — with secure login, fast list + background emails.

## 2. Day-in-life story (Rahul + Priya)
1. Rahul registers `POST /auth/register` -> gets token.
2. Rahul creates Project "Website Redesign".
3. Rahul adds Task "Fix login bug" HIGH due 25th, assigns to Priya.
4. Priya comments "Started working".
5. Rahul uploads bug.png to task.
6. Rahul filters `GET /tasks?status=TODO&priority=HIGH&search=login`.
7. Admin lists all users `GET /users`.

That flow IS the product. 4 boxes: User, Project, Task, Comment + file.

## 3. The 4 boxes (with example)

**User** = who works
- ex: {id:"u1", name:"Rahul", email:"rahul@x.com", role:"MEMBER"}
- roles: MEMBER (own data only), ADMIN (see all, delete any)

**Project** = container, e.g. "Website Redesign"
- ex: {id:"p1", name:"Website Redesign", ownerId:"u1"}
- rule: you see only yours, unless ADMIN. Delete project deletes its tasks+comments.

**Task** = unit of work, e.g. "Fix login bug"
- ex: {id:"t1", title:"Fix login bug", status:"TODO", priority:"HIGH", projectId:"p1", assigneeId:"u2", dueDate:"2026-10-25"}
- status: TODO -> IN_PROGRESS -> DONE. Overdue = dueDate passed + not DONE.
- delete = soft (hide, isDeleted=true). ADMIN can hard delete.

**Comment** = chat on task
- ex: {id:"c1", body:"Started", taskId:"t1", authorId:"u2"}

**Attachment** = file on task (jpg/png/pdf, 5MB max, stored /uploads).

## 4. How you use it (Postman = UI)
- Register then Login -> copy accessToken -> header `Authorization: Bearer <token>` for all next calls.
- Create project -> copy projectId -> create tasks under it.
- List: `GET /projects/:id/tasks?status=TODO&search=login&page=1&limit=10` returns `{data:[...], meta:{page,total}}`.
- All lists paginated. All errors look same: `{success:false,message,requestId}`.

## 5. Invisible power (why interview loves it)
- JWT access 15m + refresh 7d rotate, passwords hashed, RBAC + ownership check.
- Redis caches task list 60s (HIT on 2nd call), cleared on write.
- BullMQ sends welcome email + daily overdue check in background (API never waits).
- Tested (Jest), Dockerized (api+pg+redis), CI green, live URL, Swagger at /docs.

## 6. Say in interview (30 sec)
> "TaskFlow is a team task API. Users own projects, projects hold tasks assigned to members with comments and uploads. I secured it with JWT rotation + RBAC, sped up lists with Redis, offloaded emails to BullMQ, tested + Dockerized + deployed. Hardest was cache invalidation + N+1, fixed with key namespacing and Prisma include."

Full rules: see REQUIREMENTS.md. Build order: see MILESTONES in REQUIREMENTS Sec 12.

