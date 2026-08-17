# SURAJAI — Production-Grade AI SaaS Platform & Multi-Model Engine

![SurajAI Version](https://img.shields.io/badge/SurajAI-v1.0.0-7c3aed?style=for-the-badge&logo=sparkles)
![Tech Stack](https://img.shields.io/badge/Stack-Next.js_15_|_Express_|_Prisma_|_MySQL-blue?style=for-the-badge)
![AI Engine](https://img.shields.io/badge/AI_Engine-Gemini_1.5_|_OpenAI_GPT--4o_|_DALL--E_3-cyan?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**SurajAI** is a state-of-the-art, production-grade AI SaaS workspace platform. It features multi-model AI routing (Google Gemini & OpenAI GPT-4o), real-time SSE streaming responses, AI image generation (DALL-E 3 & FLUX), persistent long-term memory extraction, RAG document knowledge retrieval, Zod-validated tool execution, and enterprise-grade security.

---

## 🌟 Key Features

- **Multi-Provider AI Engine**: Seamlessly switch between **Google Gemini 1.5 (Flash/Pro)** and **OpenAI GPT-4o / GPT-4o Mini** with zero code modifications.
- **Real-Time SSE Streaming**: Low-latency Server-Sent Events (SSE) stream text deltas with real stop-generation controls.
- **Dual AI Image Studio**: Real AI image generation powered by **OpenAI DALL-E 3** and **Pollinations FLUX** with custom aspect ratios (`1:1`, `16:9`, `9:16`).
- **Cinematic Canvas Login Experience**: 60 FPS HTML5 canvas with a 3D Digital Human Face Profile, dense AI Brain, rotating energy portal, and parallax synth grid road.
- **RAG Knowledge Base**: Ingest PDF, TXT, DOCX files with vector embeddings and grounded citations.
- **Persistent AI Memory System**: Automatically extracts user facts and preferences with full user management controls (view, edit, purge).
- **Automated AI Tool Registry**: Zod-validated tools for Web Search, Math Calculator, Weather, and Time.
- **Enterprise Security**: Bcrypt password hashing (12 rounds), short-lived JWT access tokens, HttpOnly refresh cookies (`SameSite=Lax`), Helmet headers, and rate limiting.
- **Dark-First SaaS UI**: Premium glassmorphism design system built with Next.js 15 App Router, Tailwind CSS, Framer Motion, and Lucide Icons.

---

## 🏗️ Monorepo Architecture

```
surajai/
├── shared/                   # Common DTOs, Enums, Interfaces & Constants
│   └── src/
│       ├── types/
│       └── constants/
├── backend/                  # Express TypeScript Backend API & Prisma ORM
│   ├── prisma/
│   │   └── schema.prisma     # Production MySQL Schema (11 Core Models)
│   └── src/
│       ├── config/           # Zod Environment Validation
│       ├── controllers/      # API Controllers
│       ├── db/               # Prisma Client Singleton & Connection Health
│       ├── middlewares/      # Helmet, CORS, Rate Limiters, Centralized Error Handling
│       ├── routes/           # Express Route Registries (/api/chat, /api/auth, /api/images)
│       ├── services/         # AIService, ProviderRegistry, ImageGenerationService, RAGService
│       └── server.ts         # Express Server Entry Point
└── frontend/                 # Next.js 15 App Router Frontend
    └── src/
        ├── app/              # Root Layout, Landing Page, /login, and /workspace Workspace
        ├── components/       # CinematicLoginBg, Workspace, ImageGallery, KnowledgeView
        ├── context/          # AuthContext with Refresh Token Rotation
        └── lib/              # API Client Helpers
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root and `backend/` directory:

```env
NODE_ENV=development
PORT=5000
APP_NAME=SurajAI
APP_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000

# MySQL Database
DATABASE_URL="mysql://root:password@localhost:3306/surajai"

# Authentication Secrets
JWT_SECRET=your_jwt_access_secret_key
REFRESH_TOKEN_SECRET=your_jwt_refresh_secret_key

# AI Provider Configuration
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
```

---

## 🚀 Quick Setup & Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Generate Prisma Client & Push Database Schema

```bash
npm run db:generate
npm run db:push
```

### 3. Start Development Servers

Run backend API server:
```bash
npm run dev:backend
```
Backend endpoint: `http://localhost:5000` | Health: `http://localhost:5000/api/health`

Run frontend Next.js application:
```bash
npm run dev:frontend
```
Frontend application: `http://localhost:3000`

---

## 📊 Phase Roadmap & Completion

- [x] **Phase 1: Foundation Setup, Monorepo Layout & MySQL Prisma Schema**
- [x] **Phase 2: Database Connection & Repository Layer**
- [x] **Phase 3: Real JWT Authentication, Password Hashing & HttpOnly Refresh Cookies**
- [x] **Phase 4: Premium Workspace UI Shell & Dark-First SaaS Theme**
- [x] **Phase 5: Real Multi-Model Chat Architecture (Gemini 1.5 + OpenAI GPT-4o)**
- [x] **Phase 6: Real-Time SSE Streaming Pipeline & Stop Response Controls**
- [x] **Phase 7: Long-Term AI Memory Extraction & Controls**
- [x] **Phase 8: RAG Document Processing & Vector Citations**
- [x] **Phase 9: AI Tool System (Web Search, Weather, Time, Calculator)**
- [x] **Phase 10: Multi-Modal Vision Capabilities**
- [x] **Phase 11: Voice Speech-to-Text & Playback**
- [x] **Phase 12: Real AI Image Generation Studio (OpenAI DALL-E 3 + FLUX)**
- [x] **Phase 13: Admin Security & User Management Dashboard**

---

## 📄 License

Distributed under the MIT License. Developed by **Suraj Vishwakarma**.
