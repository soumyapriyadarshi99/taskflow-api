# TaskFlow — Database Schema (MVP)

## 1. Users

| Column         | Type         | Constraints / Purpose                             |
| -------------- | ------------ | ------------------------------------------------- |
| `id`           | UUID         | Primary Key                                       |
| `name`         | VARCHAR(100) | Required                                          |
| `email`        | VARCHAR(255) | Required, Unique                                  |
| `passwordHash` | VARCHAR(255) | Required; store hashed password, never plain text |
| `role`         | ENUM         | `MEMBER`, `ADMIN`; default `MEMBER`               |
| `createdAt`    | TIMESTAMP    | Required                                          |
| `updatedAt`    | TIMESTAMP    | Required                                          |

### Business Rules

- Email must be unique.
- Passwords must be securely hashed.
- Public responses must never expose `passwordHash`.
- Only admins can list all users.

---

## 2. Projects

| Column        | Type         | Constraints / Purpose                                    |
| ------------- | ------------ | -------------------------------------------------------- |
| `id`          | UUID         | Primary Key                                              |
| `name`        | VARCHAR(150) | Required                                                 |
| `description` | TEXT         | Optional                                                 |
| `status`      | ENUM         | `TODO`, `IN_PROGRESS`, `DONE`, `ON_HOLD`; default `TODO` |
| `dueDate`     | TIMESTAMP    | Optional                                                 |
| `createdBy`   | UUID         | Required FK → `Users.id`                                 |
| `ownerId`     | UUID         | Required FK → `Users.id`; initially same as `createdBy`  |
| `createdAt`   | TIMESTAMP    | Required                                                 |
| `updatedAt`   | TIMESTAMP    | Required                                                 |
| `updatedBy`   | UUID         | Optional FK → `Users.id`                                 |

### Business Rules

- The creator becomes the initial project owner.
- The project owner can be changed independently of the creator.
- Only the project owner or an admin can update a project.
- Project deletion is out of scope for the current implementation.
- `dueDate` is optional.
- New projects default to `TODO`.

---

## 3. Tasks

| Column        | Type         | Constraints / Purpose                                    |
| ------------- | ------------ | -------------------------------------------------------- |
| `id`          | UUID         | Primary Key                                              |
| `title`       | VARCHAR(200) | Required                                                 |
| `description` | TEXT         | Optional                                                 |
| `status`      | ENUM         | `TODO`, `IN_PROGRESS`, `DONE`, `ON_HOLD`; default `TODO` |
| `priority`    | ENUM         | `LOW`, `MEDIUM`, `HIGH`; default `MEDIUM`                |
| `dueDate`     | TIMESTAMP    | Optional                                                 |
| `projectId`   | UUID         | Required FK → `Projects.id`                              |
| `createdBy`   | UUID         | Required FK → `Users.id`                                 |
| `assigneeId`  | UUID         | Optional FK → `Users.id`                                 |
| `createdAt`   | TIMESTAMP    | Required                                                 |
| `updatedAt`   | TIMESTAMP    | Required                                                 |
| `updatedBy`   | UUID         | Optional FK → `Users.id`                                 |
| `deletedAt`   | TIMESTAMP    | Nullable; set when the task is soft-deleted              |
| `deletedBy`   | UUID         | Optional FK → `Users.id`                                 |

### Business Rules

- Every task must belong to a project.
- The task creator and assignee can be different users.
- A task can be created without an assignee.
- If an assignee is provided, that user must exist.
- The task creator, assignee, or an admin can update a task.
- Ordinary task lists must exclude soft-deleted tasks.
- A non-null `deletedAt` indicates that the task is soft-deleted.
- Admins can hard-delete tasks.
- A task is overdue when its due date has passed and its status is not `DONE`.
- New tasks default to `TODO`.

---

## 4. Comments

Comments can belong to either a project or a task.

| Column         | Type      | Constraints / Purpose                |
| -------------- | --------- | ------------------------------------ |
| `id`           | UUID      | Primary Key                          |
| `body`         | TEXT      | Required; comment content            |
| `type`         | ENUM      | `PROJECT`, `TASK`                    |
| `associatedId` | UUID      | ID of the associated project or task |
| `createdBy`    | UUID      | Required FK → `Users.id`             |
| `createdAt`    | TIMESTAMP | Required                             |
| `updatedAt`    | TIMESTAMP | Required                             |
| `updatedBy`    | UUID      | Optional FK → `Users.id`             |

### Business Rules

- Every comment must have content and a creator.
- `type` determines whether `associatedId` refers to a project or task.
- The backend must validate that the referenced entity exists.
- A conventional foreign key cannot enforce `associatedId` against both the Projects and Tasks tables.
- Comments associated with a task must be removed when that task is deleted.
- Project deletion and its comment cleanup are out of scope for now.

---

## 5. Entity Relationships

- **User → Projects:** A user can create multiple projects.
- **User → Projects:** A user can own multiple projects.
- **Project → Tasks:** A project can contain multiple tasks.
- **User → Tasks:** A user can create multiple tasks.
- **User → Tasks:** A user can be assigned multiple tasks.
- **User → Comments:** A user can create multiple comments.
- **Project / Task → Comments:** Comments can belong to either entity through `type` and `associatedId`.

---

## 6. Common Conventions

- Use UUIDs for primary keys.
- Use foreign keys wherever a direct relationship exists.
- Use `createdAt` and `updatedAt` to track record timestamps.
- Use `createdBy` and `updatedBy` where tracking the responsible user is useful.
- Keep optional fields nullable.
- Never store passwords in plain text.
- Validate permissions and business rules in the backend.
- Paginate list endpoints.
- Exclude soft-deleted tasks from normal queries.
- Both projects and tasks use the same statuses: `TODO`, `IN_PROGRESS`, `DONE`, and `ON_HOLD`.

---

## 7. Deferred Features

The following will be designed and implemented later:

- **Attachments:** File metadata, upload validation, and local storage.
- **Refresh tokens:** Token persistence and revocation for authentication.
- **Background email jobs:** Welcome emails and scheduled overdue-task notifications.
- **Project deletion:** Deletion behavior and related data cleanup.

These features are deferred from the initial implementation, not removed from the overall product requirements.
