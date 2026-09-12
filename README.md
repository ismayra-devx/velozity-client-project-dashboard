# VELOZITY — Agency Portal

Velozity is a professional multi-tenant agency management platform designed for modern digital agencies. It provides a real-time, role-isolated operational hub for Administrators, Project Managers, and Developers to coordinate projects, manage sprint deliverables, and track activity audit trails with instant WebSocket synchronization.

---

## 150–250 Word Architectural Overview

Velozity is architected around a strict separation of concerns, ensuring security and business rules remain inviolable regardless of the client interface. The backend is built with TypeScript on Node.js and Express, following an enterprise layered structure: decoupled routing, controllers for HTTP transport, domain services encapsulating business logic, Zod-powered schema validation middleware, and Prisma ORM managing a containerized PostgreSQL database. 

Authentication employs short-lived asymmetric JWT access tokens paired with cryptographically secure, HttpOnly, SameSite refresh cookies stored in the database with rotation on every renewal. Role-Based Access Control (RBAC) is enforced at the API layer across every route and database query: Administrators have global oversight, Project Managers are strictly confined to their own created projects, and Developers can only access and transition tasks explicitly assigned to them. 

Real-time collaboration is powered by Socket.IO over WebSocket transport with role-aware room partitioning. Task status transitions emit formatted audit log events to both live connected sockets and persistent database tables. On reconnect, the client fetches the latest 20 relevant missed events directly from PostgreSQL. Scheduled background cron workers evaluate task deadlines independently of user sessions, automatically flagging overdue items and broadcasting system alerts.

---

## Core Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, Socket.IO Client.
- **Backend**: Node.js, Express, TypeScript, Prisma ORM, Socket.IO, Zod, bcrypt, node-cron.
- **Database**: PostgreSQL 16 (Dockerized).
- **Security**: JWT (Access Token in memory, Refresh Token in HttpOnly cookie), Helmet, CORS, parameterized queries.

---

## Repository Structure

```text
velozity-client-project-dashboard/
├── .env.example            # Environment configuration template with placeholders
├── .gitignore              # Ignores .env, .env.local, node_modules, dist, logs
├── README.md               # Comprehensive documentation and architecture justifications
├── docker-compose.yml      # Containerized PostgreSQL 16 database setup
├── frontend/               # React 18 + TypeScript application (Vite, Tailwind CSS)
│   ├── src/
│   │   ├── components/     # UI components (Donut charts, navigation, modals)
│   │   ├── context/        # AuthContext, SocketContext (WebSockets)
│   │   ├── pages/          # Admin, PM1, PM2, Dev1, Dev2 dashboards
│   │   ├── services/       # API client with automatic JWT refresh
│   │   └── types/          # Strict TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
├── backend/                # Node.js + Express + TypeScript API server
│   ├── src/
│   │   ├── controllers/    # Transport controllers
│   │   ├── services/       # Business logic and database operations
│   │   ├── middlewares/    # JWT auth, RBAC role guard, Zod validation, error handler
│   │   ├── validators/     # Zod schemas (body, query, params)
│   │   ├── routes/         # Modular route definitions
│   │   ├── jobs/           # node-cron overdue task background worker
│   │   └── lib/            # Prisma client & Socket.IO engine with room isolation
│   ├── package.json
│   └── tsconfig.json
└── prisma/                 # Database schema and seed script
    ├── schema.prisma       # Relational models, foreign keys, cascade rules, indexes
    └── seed.ts             # Deterministic seed script (Admin, PMs, Devs, Projects, Tasks)
```

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
- Docker & Docker Compose
- Node.js v18+ and npm

### 1. Clone & Environment Configuration
```bash
git clone https://github.com/ismayra-devx/velozity-client-project-dashboard.git
cd velozity-client-project-dashboard
```

Create `.env` using `.env.example`:
```bash
cp .env.example .env
```

`.env.example` contents:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/database
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
PORT=5000
```

### 2. Start PostgreSQL via Docker
```bash
docker-compose up -d
```
Spins up a dedicated PostgreSQL 16 instance on port `5432`. *(Note: Credentials configured in `docker-compose.yml` are strictly for local containerized development and testing).*

### 3. Initialize Database & Seed
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm run seed
```
The seed script populates:
- **1 Admin, 2 PMs, 4 Developers**
- **3 Projects** across multiple clients
- **18 Tasks** across all statuses and priorities
- **2 Overdue tasks**
- **Pre-existing activity log entries** (so the activity feed is populated on first load)

### 4. Run Development Servers

**Backend (Express API + WebSocket Server)**:
```bash
cd backend
npm run dev
# Running at http://localhost:5000
```

**Frontend (Vite + React)**:
```bash
cd frontend
npm install
npm run dev
# Running at http://localhost:5173
```

---

## Architectural Decisions & Design Justifications

### 1. Backend Framework Choice: Node.js with Express vs Fastify
- **Choice**: Node.js with Express (TypeScript).
- **Justification**:
  - **Mature Middleware Ecosystem**: Express provides seamless interoperability with essential production middleware (`cookie-parser`, `cors`, `helmet`) and standardized error-handling patterns.
  - **Unified HTTP + WebSocket Server**: Native integration between Node's `http.createServer(app)` and Socket.IO engine sharing port `5000` with zero protocol impedance, allowing cookie extraction and JWT validation directly during the WebSocket handshake.
  - **Layered Architecture & Type Safety**: Combined with TypeScript and Zod schema validation middleware, Express provides clean decoupling between HTTP controllers, domain services, database access, and real-time emitters.
  - **Comparison with Fastify**: While Fastify offers micro-benchmark throughput advantages, Express eliminates schema-compilation overhead, has superior middleware ecosystem maturity, and avoids Fastify's plugin encapsulation quirks when integrating Socket.IO and Prisma client lifecycles.

### 2. Token Storage & Authentication Architecture
- **Access Token**: Short-lived (15 minutes), kept strictly in JavaScript memory within the client `AuthContext`. It is never stored in `localStorage` or `sessionStorage` to eliminate cross-site scripting (XSS) token theft vulnerabilities.
- **Refresh Token**: Long-lived (7 days), delivered via a strict `HttpOnly`, `SameSite=Lax`, `Path=/api/auth` cookie. JavaScript has zero read access to this cookie, mitigating token interception.
- **Token Rotation & Revocation**: Every refresh request revokes the existing refresh token record in PostgreSQL and issues a fresh one. If an invalid or expired token is presented, all sessions can be invalidated immediately.

### 3. WebSocket Implementation & Justification
- **Technology**: Socket.IO over WebSocket transport (`transports: ['websocket']`).
- **Justification**:
  - Socket.IO provides built-in heartbeat ping/pong failure detection, automatic exponential backoff reconnection, binary safety, and room-based channel partitioning while strictly utilizing standard WebSocket transport (`transports: ['websocket']`, zero long-polling fallback).
- **Role-Filtered Channel Partitioning**:
  - **Admin**: Automatically joins `room:global_feed` &rarr; receives activity across all projects.
  - **Project Manager**: Automatically joins `room:project_${projectId}` for projects owned by the PM &rarr; receives activity for owned projects only. Unauthorized PMs are blocked.
  - **Developer**: Receives activity only for tasks assigned to the developer via private user room `user:${userId}`. Developers cannot eavesdrop on other developers' tasks or project feeds.

### 4. Background Job Scheduler: node-cron vs Bull Queue
- **Choice**: `node-cron` daemon running in the backend service worker.
- **Justification**:
  - **Zero External Infrastructure Dependency**: Avoids mandating a dedicated Redis cluster solely for evaluating periodic 60-second overdue deadlines.
  - **Deterministic In-Process Scheduling**: Runs on schedule (`* * * * *`) with minimal RAM overhead (<5MB).
  - **PostgreSQL Transactional Safety**: Every cron execution performs indexed batch queries (`isOverdue = false AND status != 'DONE' AND dueDate < NOW()`), updates records in PostgreSQL, creates `TaskActivityLog` entries, and broadcasts notifications.
  - **When Bull Queue is Preferred**: In a horizontally autoscaled multi-instance container cluster (e.g. Kubernetes with multiple pods), BullMQ with Redis would be preferred to distribute jobs and prevent duplicate cron execution across instances.

### 5. Database Relational Design & Indexing Decisions
PostgreSQL 16 managed via Prisma ORM enforces strict relational integrity with foreign keys and cascade deletions across 7 core relational entities:
- `Client` &rarr; `Project` (1:N, `onDelete: Cascade`)
- `User` &rarr; `Project` (1:N, `onDelete: Cascade` via `createdById`)
- `Project` &rarr; `Task` (1:N, `onDelete: Cascade`)
- `User` &rarr; `Task` (1:N, `onDelete: Cascade` via `assignedToId`)
- `Task` &rarr; `TaskActivityLog` (1:N, `onDelete: Cascade`)
- `Project` &rarr; `TaskActivityLog` (1:N, `onDelete: Cascade`)
- `User` &rarr; `TaskActivityLog` (1:N, `onDelete: Cascade`)
- `User` &rarr; `Notification` (1:N, `onDelete: Cascade`)
- `User` &rarr; `RefreshToken` (1:N, `onDelete: Cascade`)

#### Indexing Decisions & Query Analysis:
Every index in `schema.prisma` was selected based on production query patterns to avoid full table scans:
1. `User([role])`: Accelerates developer assignment lookups (`GET /api/clients/developers`) and Admin user filtering.
2. `Project([createdById])`: Guarantees sub-millisecond query time for PM project scoping (`WHERE createdById = user.id`).
3. `Project([clientId])`: Accelerates client-to-project joins when assembling agency portfolios.
4. `Task([projectId])`: Powers project task listings and task detail drawer views.
5. `Task([assignedToId])`: Powers developer assigned-task listings (`WHERE assignedToId = user.id`).
6. `Task([status])`, `Task([priority])`, `Task([dueDate])`: Eliminates full table scans on URL-filtered searches (`/tasks?status=IN_PROGRESS&priority=HIGH`).
7. `Task([isOverdue, status, dueDate])`: **Composite index** specifically engineered for the 60-second background cron query (`WHERE isOverdue = false AND status != 'DONE' AND dueDate < NOW()`).
8. `TaskActivityLog([projectId, createdAt DESC])`: Powers PM project audit feed pagination (`ORDER BY createdAt DESC LIMIT 20`).
9. `TaskActivityLog([taskId, createdAt DESC])`: Optimizes per-task revision history dialogs.
10. `TaskActivityLog([createdAt DESC])`: Powers global Admin agency activity stream.
11. `Notification([userId, isRead])`: Instant unread badge count queries (`WHERE userId = user.id AND isRead = false`).
12. `Notification([userId, createdAt DESC])`: Powers notification bell drawer listing.
13. `RefreshToken([userId])`, `RefreshToken([token])`: Rapid token rotation validation and revocation checking on session refresh.

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
