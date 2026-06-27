# Database Design — Task Management System

## Entity Relationship Overview

The system has 7 main tables:

### USERS
Stores all system users with role-based access.

| Column | Type | Notes |
|---|---|---|
| id | INT (PK, auto-increment) | |
| name | VARCHAR(100) | |
| email | VARCHAR(150) | Unique |
| password | VARCHAR(255) | bcrypt hashed |
| role | ENUM | Admin, Project Manager, Collaborator |
| isActive | BOOLEAN | default true |
| mustResetPassword | BOOLEAN | default true |
| refreshToken | TEXT | nullable |

### PROJECTS
Groups tasks under a managed project.

| Column | Type | Notes |
|---|---|---|
| id | INT (PK, auto-increment) | |
| name | VARCHAR(255) | required |
| status | ENUM | To Do, In Progress, Completed |
| priority | ENUM | Low, Medium, High |
| startDate | DATE | nullable |
| endDate | DATE | nullable |
| managerId | INT (FK → users.id) | nullable |

### TASKS
Core task entity.

| Column | Type | Notes |
|---|---|---|
| id | INT (PK, auto-increment) | |
| title | VARCHAR(200) | required |
| description | TEXT | nullable |
| status | ENUM | To Do, In Progress, Completed |
| priority | ENUM | Low, Medium, High |
| dueDate | DATE | nullable, cannot be in the past |
| assignedTo | INT (FK → users.id) | nullable |
| createdBy | INT (FK → users.id) | required |
| projectId | INT (FK → projects.id) | nullable |

### COMMENTS
Task discussion thread.

| Column | Type | Notes |
|---|---|---|
| id | INT (PK) | |
| content | TEXT | required |
| taskId | INT (FK → tasks.id) | |
| userId | INT (FK → users.id) | |

### ATTACHMENTS (NEW)
Files attached to tasks.

| Column | Type | Notes |
|---|---|---|
| id | INT (PK) | |
| fileName | VARCHAR(255) | original name |
| filePath | VARCHAR(500) | stored filename on disk |
| fileType | VARCHAR(100) | MIME type |
| fileSize | INT | bytes, max 10MB |
| taskId | INT (FK → tasks.id) | |
| uploadedBy | INT (FK → users.id) | |

### NOTIFICATIONS
Real-time event log per user.

| Column | Type | Notes |
|---|---|---|
| id | INT (PK) | |
| userId | INT (FK → users.id) | |
| message | VARCHAR(500) | |
| type | ENUM | task_assigned, status_changed, comment_added, deadline_approaching, admin_update |
| isRead | BOOLEAN | default false |
| taskId | INT (FK → tasks.id) | nullable |

### OTPS
One-time passcodes for login/reset verification. Not linked by foreign key — matched by email.

| Column | Type | Notes |
|---|---|---|
| id | INT (PK) | |
| email | VARCHAR(255) | required |
| code | VARCHAR(255) | required |
| expiresAt | DATETIME | required |
| attempts | INT | default 0 |
| purpose | VARCHAR(50) | default 'login' |

## Relationships

- One **User** can create many **Tasks** (1:N via `createdBy`)
- One **User** can be assigned many **Tasks** (1:N via `assignedTo`)
- One **User** can manage many **Projects** (1:N via `managerId`)
- One **Project** can have many **Tasks** (1:N via `projectId`)
- One **Task** can have many **Comments** (1:N)
- One **Task** can have many **Attachments** (1:N)
- One **User** can receive many **Notifications** (1:N)
- One **Task** can trigger many **Notifications** (1:N)
- **Otps** are matched to a **User** by `email`, not a foreign key

## Indexing Recommendations

- `users.email` — unique index (already enforced)
- `tasks.assignedTo`, `tasks.status` — composite index for dashboard filtering
- `tasks.projectId` — index for filtering tasks by project
- `notifications.userId`, `notifications.isRead` — composite index for unread counts
- `otps.email` — index for fast lookup during verification
