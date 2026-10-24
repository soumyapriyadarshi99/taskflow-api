# TaskFlow — Product Requirements

> A team task-management backend (mini Jira / Trello). **Backend only — no frontend.** The UI is Postman / Swagger. Users register, create projects, add tasks, assign work, comment, and upload files. Access is secured with login + role-based permissions.

## 1. Vision (one-liner)

A REST API that lets teams organize work: register and log in, create projects, create tasks inside projects, assign tasks to teammates, add comments, and attach files — all with secure authentication, role-based access, and background email notifications.

## 2. Why we are building it

### The problem
Teams need a lightweight way to track who is doing what, by when, and on which project — without the complexity of a full project-management suite. Existing tools are often over-featured, require a frontend, or lock teams into a specific UI. Smaller teams and individual developers frequently need just a reliable API they can plug into their own clients, scripts, or dashboards.

### The goal
Build a production-grade, interview-grade backend that demonstrates:

- **Secure access** — user registration/login, JWT access plus refresh tokens, password hashing, role-based access control (MEMBER versus ADMIN), and ownership checks so users only touch their own resources.
- **Reliable data** — projects, tasks, comments, and attachments with clear lifecycles (TODO to IN_PROGRESS to DONE), soft deletes, pagination, filtering, and search.
- **Background work** — welcome emails on registration and daily overdue-task checks, handled asynchronously so the API never waits on email.
- **Operational polish** — consistent error shapes, request tracing, health checks, structured logging, tests, Docker, CI, and Swagger documentation.

This is a portfolio and interview-ready project designed to be explained end-to-end: data model, authentication, caching, background jobs, testing, Docker, deployment, and scaling trade-offs.

## 3. For whom we are building it

| Persona | Role in the system |
|---------|-------------------|
| **Team member** | Registers and logs in. Creates projects. Creates, updates, and deletes tasks inside projects they own. Assigns tasks to teammates. Adds comments. Uploads attachments. Views their own projects and tasks. |
| **Task assignee** | Is assigned to tasks by project owners. Comments on tasks they are working on. Updates task status as they progress (TODO to IN_PROGRESS to DONE). |
| **Administrator** | Has all team-member abilities plus the ability to list all users, view any project or task, and delete any project or task in the system. |

Primary consumers are the users themselves (via Postman or Swagger during development) and the developer showcasing the system in interviews.

## 4. Core features (MVP)

### 4.1 Authentication & users
- Register with name, email, and password (email must be unique).
- Log in with email and password; invalid credentials are rejected.
- Receive an access token and a refresh token on login or registration.
- Send the access token (`Authorization: Bearer <token>`) on every protected request.
- Refresh an expired access token using the refresh token.
- Log out, which invalidates the refresh token.
- View your own profile without exposing your password hash.
- Administrators can list all users (passwords never returned).

### 4.2 Projects
- Create a project (name required; optional description). The creator becomes the owner.
- View your own projects; administrators view all projects.
- View a single project's details.
- Update a project's name or description — owner or administrator only.
- Delete a project — owner or administrator only. Deleting a project removes its tasks and any related comments and attachments.

### 4.3 Tasks
- Create a task inside a project (title required; optional description, status, priority, due date, assignee).
- List tasks with filters for project, status, priority, and keyword search; results are paginated.
- View a single task's details.
- Update a task — task owner, assignee, or administrator only. Updates include title, description, status, priority, due date, and assignee.
- Task lifecycle: TODO to IN_PROGRESS to DONE.
- A task is overdue when its due date has passed and it is not yet DONE.
- Soft-delete a task so it is hidden from lists; administrators can hard-delete.
- Assign a task to another user (the assignee must exist).

### 4.4 Comments
- Add a comment to a task (text required).
- View all comments on a task, paginated.
- Deleting a task removes its comments.

### 4.5 Attachments
- Upload one file to a task (jpg, png, or pdf; maximum 5 MB).
- Files are stored locally (with an abstraction ready for cloud storage later).
- Invalid file types or files larger than 5 MB are rejected.

### 4.6 Background emails (non-blocking)
- A welcome email is queued when a user registers; the API never waits for email delivery.
- A daily background job checks for overdue tasks and sends overdue notifications.

### 4.7 Shared behaviors across all endpoints
- Every list is paginated (page, limit, total).
- Every error response has the same shape: { success: false, message, requestId }.
- Every successful response includes a requestId for tracing.
- A /health endpoint reports service liveness.

## 5. Domain model (entities and attributes)

These are the business entities and their key attributes. Use this to design your database schema — you decide the exact column types, primary keys, indexes, nullability, and delete behavior.

### User
- Email (unique)
- Name
- Password hash (never returned in API responses)
- Role (MEMBER or ADMIN)
- Timestamps

### Project
- Name (required)
- Description (optional)
- Owner
- Timestamps

### Task
- Title (required)
- Description (optional)
- Status (TODO, IN_PROGRESS, or DONE)
- Priority (LOW, MEDIUM, or HIGH)
- Due date (optional)
- Assignee (optional)
- Soft-delete flag
- Timestamps

### Comment
- Body text (required)
- Author
- Timestamps

### Attachment
- Stored filename
- Original file name
- MIME type
- File size
- Storage path
- Uploader
- Timestamps

### Business rules to encode
- Duplicate email is not allowed.
- Only the project owner or an administrator can modify or delete a project.
- Only the task owner, assignee, or an administrator can modify or delete a task.
- Deleting a project removes its tasks and any related comments and attachments.
- Deleting a task removes its comments and attachment.
- Soft-deleted tasks are hidden from ordinary lists; administrators can hard-delete.


## 6. API surface (what the client calls)

All routes live under a versioned base path. Protected routes require a bearer access token.

| Area | Endpoints |
|------|-----------|
| Auth | register, login, refresh, logout, me |
| Users | list all (administrator only) |
| Projects | create, list mine or all, get, update, delete |
| Tasks | create, list with filters search and pagination, get, update, soft delete or hard delete |
| Comments | create on a task, list on a task |
| Attachments | upload to a task |
| System | health |

## 7. Out of scope (not building in MVP)

- No frontend or web UI (Postman/Swagger is the client).
- No real SMTP email server (emails are queued; delivery mechanism is an implementation detail).
- No cloud object storage (files stored locally with a swappable abstraction).
- No OAuth or social login, no payments, no real-time sockets, no GraphQL.

## 8. How we know it is done (acceptance)

- A new user can register, log in, and get a token.
- A token-holder can create a project, then create read update delete tasks inside it.
- Tasks can be assigned, commented on, and have a file attached.
- Lists are paginated and filterable by status, priority, and keyword.
- An administrator can list all users and delete any project or task.
- Invalid requests (bad email, wrong password, oversized file, missing token) return clear, consistent errors.
- The API is documented in Swagger so a stranger can test every endpoint in Postman without asking questions.

Design your database schema (tables, columns, relationships, indexes) based on Section 5, then share it here and I will verify it against these requirements before you build.