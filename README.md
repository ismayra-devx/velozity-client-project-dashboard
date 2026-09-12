# VELOZITY — Agency Portal

Velozity is a professional multi-tenant agency management platform designed for modern digital agencies. It provides a real-time, role-isolated operational hub for Administrators, Project Managers, and Developers to coordinate projects, manage sprint deliverables, and track activity audit trails with instant WebSocket synchronization.

---

## 150–250 Word Architectural Overview

Velozity is architected around a strict separation of concerns, ensuring security and business rules remain inviolable regardless of the client interface. The backend is built with TypeScript on Node.js and Express, following an enterprise layered structure: decoupled routing, controllers for HTTP transport, domain services encapsulating business logic, Zod-powered schema validation middleware, and Prisma ORM managing a containerized PostgreSQL database. 

Authentication employs short-lived asymmetric JWT access tokens paired with cryptographically secure, HttpOnly, SameSite refresh cookies stored in the database with rotation on every renewal. Role-Based Access Control (RBAC) is enforced at the API layer across every route and database query: Administrators have global oversight, Project Managers are strictly confined to their own created projects, and Developers can only access and transition tasks explicitly assigned to them. 

Real-time collaboration is powered by Socket.IO over genuine WebSockets with role-aware room partitioning. Task status transitions emit formatted audit log events to both live connected sockets and persistent database tables. If a client disconnects, an offline catch-up endpoint queries PostgreSQL directly upon reconnect, ensuring zero missed events. Scheduled background cron workers evaluate task deadlines independently of user sessions, automatically flagging overdue items and broadcasting system alerts.

---

## Core Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, Socket.IO Client.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Socket.IO, Zod, bcrypt, node-cron.
- **Database**: PostgreSQL 16 (Dockerized).
- **Security**: JWT (Access Token in memory, Refresh Token in HttpOnly cookie), Helmet, CORS, parameterized queries.

---

## Pre-Configured Demo Accounts

All demo accounts share the password: `Password123!`

| Role | Name | Email | Permissions & Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | Sarah Connor | `admin@velozity.com` | Global agency oversight, all projects, users, clients, full audit log |
| **PM 1** | Jordan Lee | `pm1@velozity.com` | Manages own projects (*Omnichannel E-Commerce*, *NextGen Telehealth*), assigns tasks, monitors team |
| **PM 2** | Elena Rostova | `pm2@velozity.com` | Manages own projects (*Cloud Infrastructure Modernization*), strictly isolated from PM 1 |
| **Dev 1** | Ravi Sharma | `dev1@velozity.com` | Views assigned queue, 1-click status transitions, personal workload metrics |
| **Dev 2** | Priya Patel | `dev2@velozity.com` | Views assigned queue, 1-click status transitions, personal workload metrics |

---

## Quickstart & Local Setup

### Prerequisites
- [Docker](https://www.docker.com/) & Docker Compose
- [Node.js](https://nodejs.org/) v18+ and npm

### 1. Clone & Environment Configuration
```bash
git clone <repository-url>
cd "Assignment intern 1"
```

Configure `server/.env` (pre-configured template in `server/.env.example`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/velozity_db?schema=public"
JWT_ACCESS_SECRET="velozity_access_token_secret_key_2026_xyz"
JWT_REFRESH_SECRET="velozity_refresh_token_secret_key_2026_xyz"
JWT_ACCESS_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"
```

### 2. Start PostgreSQL via Docker
```bash
docker-compose up -d
```
This spins up a dedicated PostgreSQL 16 instance on port `5432`.

### 3. Initialize Database & Seed
```bash
cd server
npm install
npx prisma migrate dev --name init
npm run seed
```
The seed script populates 1 Admin, 2 PMs, 4 Developers, 3 distinct projects, 18 tasks across multiple statuses and priorities, active overdue tasks, and historical activity logs.

### 4. Run Development Servers

**Backend (Express API + WebSocket Server)**:
```bash
cd server
npm run dev
# Running at http://localhost:5000
```

**Frontend (Vite + React)**:
```bash
cd client
npm install
npm run dev
# Running at http://localhost:5173
```

---

## Architectural Decisions & Design Justifications

### 1. Token Storage & Authentication Architecture
- **Access Token**: Short-lived (15 minutes), kept strictly in JavaScript memory within the client `AuthContext`. It is never stored in `localStorage` or `sessionStorage` to eliminate cross-site scripting (XSS) token theft vulnerabilities.
- **Refresh Token**: Long-lived (7 days), delivered via a strict `HttpOnly`, `SameSite=Lax`, `Path=/api/auth` cookie. JavaScript has zero read access to this cookie.
- **Token Rotation**: Every refresh request revokes the old refresh token record in PostgreSQL and issues a fresh one, preventing token reuse and replay attacks.

### 2. WebSocket Implementation & Justification
- **Technology**: Socket.IO over standard native WebSockets.
- **Justification**: Socket.IO provides heartbeat ping/pong failure detection, automatic reconnect backoff, room-based broadcast segmentation, and binary safety while maintaining low-overhead WebSocket transport without falling back to inefficient HTTP long-polling.
- **Room Segmentation**: Sockets automatically join `project:{projectId}` and `user:{userId}` rooms upon authenticated connection. Project updates are dispatched only to members authorized to view that project, preserving confidentiality.

### 3. Background Job Scheduler & Justification
- **Technology**: `node-cron` daemon running in the backend service worker.
- **Justification**: A decoupled cron job runs every minute to query tasks where `dueDate < NOW()` and `status != 'DONE'`. It flags `isOverdue = true` in PostgreSQL, persists a `TaskActivityLog` entry, generates notifications, and broadcasts real-time alerts. This ensures overdue state is produced autonomously without depending on a user opening the application.

### 4. Database Relational Design & Indexing Decisions
PostgreSQL with Prisma enforces foreign keys and cascade deletions across 6 core entities: `User`, `Client`, `Project`, `Task`, `TaskActivityLog`, `Notification`, and `RefreshToken`.

Key composite indexes were chosen based on query analysis:
- `Task([projectId])` & `Task([assignedToId])`: Accelerates role-filtered task listings for PMs and Developers.
- `Task([status])` & `Task([priority])` & `Task([dueDate])`: Eliminates full table scans when filtering by URL query parameters.
- `Task([isOverdue, status, dueDate])`: Composite index specifically targeting the recurring 60-second cron job query.
- `TaskActivityLog([projectId, createdAt DESC])`: Powers instantaneous feed retrieval and pagination for project dashboards.
- `TaskActivityLog([taskId, createdAt DESC])`: Optimizes task audit history dialogs.
- `Notification([userId, isRead])`: Accelerates unread notification badge count lookups.

---

## Role-Based Access Control (RBAC) Specification

All security is enforced on the server. If the frontend UI is bypassed completely (e.g. via cURL or Postman), the API enforces strict authorization:

| Action / Endpoint | Admin | Project Manager | Developer |
| :--- | :---: | :---: | :---: |
| `GET /api/projects` | All agency projects | Only projects created by self | Only participating projects |
| `POST /api/projects` | Allowed | Allowed | **403 Forbidden** |
| `PUT /api/projects/:id` | Allowed | Only owned project | **403 Forbidden** |
| `GET /api/tasks` | All tasks | Own projects' tasks | Only assigned tasks |
| `POST /api/tasks` | Allowed | Own projects only | **403 Forbidden** |
| `PATCH /api/tasks/:id/status` | Allowed | Own projects' tasks | Assigned tasks only |
| `GET /api/users` | Allowed | **403 Forbidden** | **403 Forbidden** |
| `GET /api/clients` | Allowed | Allowed | **403 Forbidden** |

---

## Real-Time Feed & Missed-Event Recovery

1. **Format**: Every event follows the human-readable standard:
   `[Actor Name] moved Task #[Number] from [From Status] → [To Status] · [Relative Time]`
2. **Instant Sync**: When Developer updates status, PM and Admin screens receive the `activity:new` and `task:updated` events over WebSocket with zero page refresh and zero polling.
3. **Missed Events**: If a client disconnects and reconnects after multiple activities occur, `SocketContext` triggers `GET /api/activities/missed`, recovering recent events directly from PostgreSQL rather than an ephemeral memory buffer.

---

## URL-Shareable Filters

Task Explorer filters are bound bidirectionally to URL search parameters:
- Example: `http://localhost:5173/tasks?status=IN_PROGRESS&priority=HIGH`
- Sharing or refreshing this URL reproduces the exact filter state across different browsers.

---

## Known Limitations & Production Enhancements

1. **Distributed Cron**: In multi-instance cluster deployments, `node-cron` should be transitioned to a distributed job queue (e.g., BullMQ with Redis) to prevent duplicate runs across horizontal pods.
2. **File Attachments**: Tasks currently support markdown descriptions; binary attachment storage (e.g., AWS S3 or Cloud Storage) can be plugged in via signed URLs.
3. **Audit Log Archival**: Historical activity logs can be partitioned or archived to cold storage after 90 days in enterprise scale deployments.
