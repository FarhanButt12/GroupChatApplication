<div align="center">

  # ⚡ NEXUS HQ — Enterprise Distributed Group Chat Application

  **A modern, production-grade group communication system featuring WebSockets, BullMQ distributed worker flows, Google OAuth 2.0, and automated Gemini AI chat summaries.**

  [![NestJS](https://img.shields.io/badge/Backend-NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
  [![Next.js](https://img.shields.io/badge/Frontend-Next.js_16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
  [![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![Prisma](https://img.shields.io/badge/ORM-Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
  [![BullMQ](https://img.shields.io/badge/Job_Queue-BullMQ-CC0000?style=for-the-badge&logo=redis&logoColor=white)](https://docs.bullmq.io/)
  [![Redis](https://img.shields.io/badge/Cache-Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
  [![Socket.IO](https://img.shields.io/badge/Real--Time-Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
  [![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

</div>

---

## 🌟 Executive Overview

**Nexus HQ** is an enterprise-level group messaging platform designed to showcase the progressive architectural evolution of real-time web applications. Built for the **Qodeon Labs Internship Assignment**, the project transitions from simple REST polling to zero-latency Socket.IO WebSockets, culminating in a distributed **BullMQ parent-child job flow architecture** powered by Google's Gemini AI.

---

## 🚀 Key Features & Capabilities

### 🔒 Authentication & Authorization
* **Dual Auth Engine**: Custom JWT-based authentication + **Real Google OAuth 2.0** authentication (`google-auth-library` & Google Identity Services SDK).
* **Auto-Provisioning**: Automatic account creation for first-time Google sign-ins.
* **Role-Based Membership**: Group authorization (`ADMIN`, `MEMBER`) enforced via NestJS Guards.

### 💬 Real-Time Messaging & Workspace Groups
* **Instant WebSocket Engine**: Low-latency message broadcasting via Socket.IO rooms (`group_${groupId}`).
* **Group Management**: Create workspace groups, join locked groups, and leave groups with confirmation modals.
* **Smart Auto-Scroll**: Intelligent scroll position preservation allowing users to inspect past history without auto-scrolling jitter.

### 🛠️ Enterprise Bonus Features
* 🟢 **Typing Indicators**: Real-time broadcast when members are typing.
* 🟢 **Presence Tracking**: Online active members drawer with live status badges (`Online`, `Focus`, `Away`).
* 🟢 **Message Reactions**: Interactive emoji reaction toolbar (`👍`, `❤️`, `🔥`, `🚀`, `😂`, `🎉`, `💯`, `🙏`).
* 🟢 **Read Receipts**: Visual double-check marks (`✓✓`) tracking read receipts per group member.
* 🟢 **File & Media Uploads**: Integrated `Multer` file storage serving inline images and downloadable documents.
* 🟢 **Edit & Soft Delete**: Full message lifecycle with `(edited)` badges and clean soft-deletion (`"This message was deleted"`).
* 🟢 **In-Chat Message Search**: Server-side and client-side message keyword search filter.

---

## ⚙️ Architectural Evolution (Multi-Phase Branches)

The repository strictly follows a multi-branch engineering path:

| Phase | Git Branch | Core Architectural Milestone |
| :--- | :--- | :--- |
| **Phase 1** | `feature/rest-chat` | Full REST API baseline (`POST /auth`, `GET/POST /groups`, `GET/POST /messages`). |
| **Phase 2** | `feature/chat-polling` | Client-side 10-second polling fallback mechanism using custom React hooks. |
| **Phase 3** | `feature/chat-websocket` | Full Socket.IO WebSocket gateway replacing polling with real-time room events. |
| **Phase 4** | `feature/chat-summary` | 24-hour repeatable BullMQ background job + Vercel AI SDK Gemini summarization. |
| **Phase 5** | `feature/chat-summary-distributed` | Multi-worker distributed BullMQ `FlowProducer` with configurable worker concurrency. |
| **Phase 6** | `feature/chat-bonus-features` | Production features: Google OAuth 2.0, Leave Group, "Group" UI, and all 8 bonus features. |

---

## 🏗️ Distributed Worker Architecture (BullMQ Flows)

Phase 5 introduces a production-grade **Parent-Child Distributed Queue Architecture** powered by Redis and BullMQ:

```mermaid
graph TD
    A[Repeatable Scheduler Job 24h] -->|Triggers| B[scheduler-queue / scheduler-worker]
    B -->|Queries Active Groups 24h| C[FlowProducer Parent Job]
    
    subgraph FlowProducer Orchestration Tree
        C --> D[daily-summary-scheduler]
        D --> E1[group-summary-1]
        D --> E2[group-summary-2]
    end
    
    subgraph Distributed Child Queues & Workers
        E1 --> F1[summary-queue / summary-worker: fetch-messages]
        F1 --> F2[ai-queue / ai-worker: generate-ai-summary]
        F2 --> F3[notification-queue / notification-worker: publish-summary]
    end
```

### ⚡ Configurable Worker Concurrency
Workers scale independently via environment variables without requiring code changes:
```env
SCHEDULER_WORKER_CONCURRENCY=1
SUMMARY_WORKER_CONCURRENCY=5
AI_WORKER_CONCURRENCY=10
NOTIFICATION_WORKER_CONCURRENCY=3
```

---

## 🗄️ Database Architecture & Schema Design

Powered by **PostgreSQL** and **Prisma ORM** with optimized indexes and cascade relationships:

```mermaid
erDiagram
    User ||--o{ GroupMember : joins
    User ||--o{ Message : sends
    User ||--o{ Reaction : reacts
    User ||--o{ ReadReceipt : marks
    Group ||--o{ GroupMember : contains
    Group ||--o{ Message : holds
    Message ||--o{ Reaction : receives
    Message ||--o{ ReadReceipt : tracks
```

### 🔍 Key Database Indexes
* `Message`: `@@index([groupId, createdAt])` — Enables fast paginated message queries.
* `GroupMember`: `@@unique([groupId, userId])` & `@@index([groupId])` — Fast membership validation.
* `Reaction`: `@@unique([messageId, userId, emoji])` — Prevents duplicate reactions per user.
* `ReadReceipt`: `@@unique([messageId, userId])` — Idempotent read receipts tracking.

---

## 🛠️ Installation & Setup Guide

### 📋 Prerequisites
* **Node.js**: `v18.x` or later
* **PostgreSQL**: Local or Cloud instance (Port 5432)
* **Redis**: Local or Cloud instance (Port 6379)

### 1️⃣ Clone Repository
```bash
git clone https://github.com/FarhanButt12/GroupChatApplication.git
cd GroupChatApplication
```

### 2️⃣ Backend Setup
```bash
cd backend
npm install
```

Configure `backend/.env`:
```env
PORT=3000
DATABASE_URL="postgresql://postgres:password@localhost:5432/ModernChatApplication?schema=public"
JWT_SECRET="super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
REDIS_HOST="localhost"
REDIS_PORT=6379

# Google Gemini / Groq API Key
GROQ_API_KEY="your-groq-or-gemini-api-key"

# Google OAuth Credentials
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:3001/auth/google/callback"

# Distributed Worker Concurrency
SCHEDULER_WORKER_CONCURRENCY=1
SUMMARY_WORKER_CONCURRENCY=5
AI_WORKER_CONCURRENCY=10
NOTIFICATION_WORKER_CONCURRENCY=3
```

Run Database Migrations:
```bash
npx prisma migrate dev --name init
```

Start Backend Development Server:
```bash
npm run start:dev
```

### 3️⃣ Frontend Setup
```bash
cd ../frontend
npm install
```

Configure `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
```

Start Frontend Development Server:
```bash
npm run dev
```

Visit `http://localhost:3001` in your browser!

---

## 📡 API Reference Overview

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/auth/register` | Register a new user account | ❌ |
| `POST` | `/auth/login` | Sign in with email & password | ❌ |
| `POST` | `/auth/google` | Authenticate via Google OAuth ID token | ❌ |
| `GET` | `/groups` | List all workspace groups | 🔐 |
| `POST` | `/groups` | Create a new group (Creator becomes ADMIN) | 🔐 |
| `GET` | `/groups/:id` | Get group details & members | 🔐 |
| `POST` | `/groups/:id/join` | Join a workspace group | 🔐 |
| `POST` | `/groups/:id/leave` | Leave a workspace group | 🔐 |
| `GET` | `/groups/:id/messages` | Get paginated message history | 🔐 |
| `POST` | `/groups/:id/messages` | Send a new message | 🔐 |
| `POST` | `/groups/:id/messages/upload` | Upload image or document attachment | 🔐 |
| `PATCH` | `/groups/:id/messages/:msgId` | Edit an existing message | 🔐 |
| `DELETE` | `/groups/:id/messages/:msgId` | Soft delete a message | 🔐 |
| `POST` | `/groups/:id/messages/:msgId/react` | Toggle emoji reaction | 🔐 |
| `POST` | `/groups/:id/messages/:msgId/read` | Mark message as read | 🔐 |

---

## 👨‍💻 Developer & Credits

Developed by **Muhammad Farhan Mukhtar Butt**  
* 🐙 GitHub: [@FarhanButt12](https://github.com/FarhanButt12)  
* 🏢 Assignment: Qodeon Labs Internship Project
