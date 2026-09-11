# Velozity Global Solutions — Technical Hiring Assessment

> **Full Stack Developer Role**  
> **Task:** Build a Real-Time Client Project Dashboard with Role-Based Access & Live Activity Feed  

---

## 1. Executive Summary & Assessment Explanation

### Technical Assessment Explanation (150–250 words)

> The most challenging aspect of this project was engineering a multi-tenant, real-time activity feed that guarantees strict role-based data isolation across both WebSocket emissions and reconnect catchup states. To solve this, I designed a room-routing topology in Socket.io partitioned by user (`user:${id}`), project (`room:project_${id}`), and elevated admin global feeds (`room:global_feed`). Handshake authentication cryptographically decodes the JWT access token, mapping socket subscriptions exclusively to owned entities. When a task status transition occurs, the update transaction writes an immutable `TaskActivityLog` row before emitting strictly to authorized rooms—preventing Developers from eavesdropping on unassigned tasks and restricting Project Managers to their created projects. For reconnects, a dedicated catchup query fetches the latest 20 events directly from PostgreSQL applying row-level ownership clauses (`WHERE createdById` or `assignedToId`), eliminating memory cache inconsistencies. If doing this differently at scale, I would decouple the real-time emission layer using Redis Pub/Sub with a multi-node BullMQ worker cluster. This would isolate background overdue evaluations from the Express event loop and enable zero-downtime horizontal scaling across containerized replicas.

---

## 2. Core Architecture & Tech Stack

```mermaid
flowchart TD
    Client["React 18 + TypeScript Client (Vite + TailwindCSS)"] <--> |REST API (Credentials: Include)| ExpressApp["Node.js Express Server (TypeScript)"]
    Client <--> |WebSocket (Handshake JWT Auth)| SocketServer["Socket.io Real-Time Engine"]
    ExpressApp --> |Zod Schemas| Middlewares["Auth & Strict RBAC Middlewares"]
    Middlewares --> Controllers["Controllers (Clean Architecture)"]
    Controllers --> Services["Domain Services (Projects, Tasks, Feeds)"]
    Services --> Prisma["Prisma ORM (ACID Transactions)"]
    Prisma --> Postgres[("PostgreSQL Database with Targeted Indexes")]
    NodeCron["node-cron Scheduler (Every 1 min)"] --> |Scan Overdue Tasks| Services
    Services --> |Broadcast Events| SocketServer
```

### Architectural Decisions & Justifications

1. **WebSocket Library Choice: `Socket.io` over Native WebSockets**
   - *Rationale:* Socket.io provides production-tested room partitioning (`to(room).emit()`), essential for enforcing role-specific feeds (`room:global_feed`, `room:project_${id}`, `user:${id}`) without manual multiplexing. It includes native connection state recovery, automatic heartbeat disconnect detection, and seamless HTTP long-polling fallback for constrained proxy environments.

2. **Job Queue Choice: `node-cron` over Bull/BullMQ**
   - *Rationale:* For a single-instance deployment, `node-cron` provides zero external infrastructure overhead (no Redis required), deterministic minute-level cron precision, and runs directly in the Node.js runtime. When scaling horizontally across multiple server instances, the service layer is decoupled so that swapping `node-cron` with a distributed BullMQ/Redis worker cluster requires zero changes to the underlying database models or WebSocket broadcast helpers.

3. **Authentication & Token Storage Approach: Short-Lived JWT + HttpOnly SameSite Cookie**
   - *Rationale:* Storing refresh tokens in `localStorage` leaves users vulnerable to Cross-Site Scripting (XSS) attacks. In this application, the 7-day refresh token is stored exclusively inside an `HttpOnly`, `SameSite=Lax`, `Path=/api/auth` cookie inaccessible to JavaScript. The 15-minute access token is kept in memory and passed via the `Authorization: Bearer <token>` header. Automatic refresh token rotation is handled seamlessly by an HTTP client interceptor.

4. **Web Framework: Express + TypeScript**
   - *Rationale:* Express offers transparent middleware composability (`authenticateToken` &rarr; `requireRoles` &rarr; `validateRequest`), predictable request lifecycles, and battle-tested compatibility with `@prisma/client` and `socket.io`.

---

## 3. Database Schema & Indexing Decisions

### Database Schema (Prisma PostgreSQL)

```mermaid
erDiagram
    User ||--o{ Project : "createdProjects"
    User ||--o{ Task : "assignedTasks"
    User ||--o{ TaskActivityLog : "activities"
    User ||--o{ Notification : "notifications"
    User ||--o{ RefreshToken : "refreshTokens"
    Client ||--o{ Project : "projects"
    Project ||--o{ Task : "tasks"
    Project ||--o{ TaskActivityLog : "activityLogs"
    Task ||--o{ TaskActivityLog : "activityLogs"
    Task ||--o{ Notification : "notifications"

    User {
        string id PK
        string email UK
        string passwordHash
        string name
        Role role "ADMIN | PROJECT_MANAGER | DEVELOPER"
        datetime createdAt
    }

    Client {
        string id PK
        string name
        string company
        string email UK
        string phone
    }

    Project {
        string id PK
        string name
        string description
        ProjectStatus status
        string clientId FK
        string createdById FK
        datetime createdAt
    }

    Task {
        string id PK
        int taskNumber UK
        string title
        string description
        TaskStatus status "TODO | IN_PROGRESS | IN_REVIEW | DONE"
        TaskPriority priority "LOW | MEDIUM | HIGH | CRITICAL"
        datetime dueDate
        boolean isOverdue
        string projectId FK
        string assignedToId FK
    }

    TaskActivityLog {
        string id PK
        string taskId FK
        string projectId FK
        string userId FK
        string action
        string fromStatus
        string toStatus
        string message
        datetime createdAt
    }

    Notification {
        string id PK
        string userId FK
        string taskId FK
        string title
        string message
        boolean isRead
        datetime createdAt
    }
```

### Strategic Indexing Rationale

- `Project(createdById)`: Optimizes Project Manager queries (`WHERE createdById = :pmId`). PMs cannot view or modify other PMs' projects; this index guarantees index-scan lookups rather than full table scans.
- `Task(projectId)`: Accelerates task loading within individual project boards and detail views.
- `Task(assignedToId)`: Critical for Developer queries (`WHERE assignedToId = :devId`), ensuring instant rendering of the Developer dashboard.
- `Task(isOverdue, status, dueDate)`: **Composite Index** specifically crafted for the background cron scheduler query:
  ```sql
  SELECT * FROM "Task"
  WHERE "isOverdue" = false
    AND "status" != 'DONE'
    AND "dueDate" < NOW();
  ```
  This compound index turns what would be an expensive table scan every minute into an index-range scan.
- `TaskActivityLog(projectId, createdAt DESC)`: Provides sub-millisecond retrieval of the most recent activity feed events for project rooms and PM dashboards.
- `TaskActivityLog(createdAt DESC)`: Accelerates global feed loading for Admins.
- `Notification(userId, isRead)`: Optimizes unread notification badge counters and dropdown retrieval.

---

## 4. Role-Based Access Control (RBAC) Specification

Role enforcement is executed strictly at the Express API layer using middlewares and Prisma row-level ownership clauses:

| Feature | Admin | Project Manager | Developer |
|---|---|---|---|
| **Clients** | View & Create all | View & Create all | No access |
| **Projects** | View, Create, Edit all | Create; View & Edit **only projects they created** | View **only projects where they have assigned tasks** |
| **Tasks** | View, Create, Edit all | Create & Edit tasks in **their own projects** | View **only assigned tasks**; update status |
| **Status Updates** | Any task | Tasks in their own projects | **Only tasks assigned to them** |
| **Real-time Feed** | Global feed (all projects) | Feed for **their own projects only** | Feed for **their assigned tasks only** |
| **Active Presence** | Live count + online user list | Connection state only | Connection state only |

---

## 5. Local Setup Instructions

### Prerequisites
- Node.js v18+ (tested on v24)
- Docker & Docker Compose (or local PostgreSQL instance)

### Option A: Quickstart with Docker Compose (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd velozity-dashboard
   ```

2. **Start the PostgreSQL database via Docker:**
   ```bash
   docker compose up -d postgres
   ```

3. **Install dependencies and setup Backend:**
   ```bash
   cd server
   npm install
   npx prisma db push
   npm run seed
   npm run dev
   ```
   *The backend runs at `http://localhost:5000`.*

4. **Install dependencies and start Frontend:**
   ```bash
   cd ../client
   npm install
   npm run dev
   ```
   *The frontend runs at `http://localhost:5173`.*

---

### Option B: Using Remote PostgreSQL (Neon, Supabase, Railway)

If running without local Docker:
1. In `server/.env`, update `DATABASE_URL` with your PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://username:password@your-host:5432/velozity_db?sslmode=require"
   ```
2. Run database migration and seed:
   ```bash
   cd server
   npx prisma db push
   npm run seed
   npm run dev
   ```

---

## 6. Seed Accounts & Demo Credentials

Password for all accounts: **`Password123!`**

| Role | Email | Name | Scope / Permissions |
|---|---|---|---|
| **Admin** | `admin@velozity.com` | Sarah Connor | Full global access across all projects, clients, users, presence |
| **Project Manager 1** | `pm1@velozity.com` | Alex Morgan | Owns Project 1 (Telehealth) and Project 2 (Cloud Infra) |
| **Project Manager 2** | `pm2@velozity.com` | Jordan Lee | Owns Project 3 (Omnichannel E-Commerce) |
| **Developer 1** | `dev1@velozity.com` | Ravi Sharma | Assigned to Task #1 (Overdue), Task #3, Task #5, Task #11, Task #17 |
| **Developer 2** | `dev2@velozity.com` | Elena Rostova | Assigned to Task #2 (Overdue), Task #7, Task #9, Task #15, Task #18 |
| **Developer 3** | `dev3@velozity.com` | Marcus Chen | Assigned to Task #4, Task #8, Task #12, Task #14 |
| **Developer 4** | `dev4@velozity.com` | Priya Patel | Assigned to Task #6, Task #10, Task #13, Task #16 |

> **Evaluator Tip:** The web application features an instant **1-Click Role Switcher** in the top navigation bar, enabling you to test role boundaries and data isolation across Admin, PM 1, PM 2, and Developers in seconds.

---

## 7. Known Limitations & Production Enhancements

1. **Multi-Node WebSocket Scaling:** Currently uses in-memory Socket.io adapter. For horizontal scaling across multiple container instances, `@socket.io/redis-adapter` would be integrated.
2. **Distributed Job Execution:** The overdue scheduler uses in-process `node-cron`. In clustered environments, distributed locking via BullMQ and Redis would prevent duplicate task evaluations across pods.
3. **Audit Export:** While all task status mutations are captured in `TaskActivityLog`, a future iteration could include CSV/JSON audit report exports for compliance review.
