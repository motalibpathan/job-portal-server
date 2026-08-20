# AGENT.md - Job Portal Server

## Project Overview

This is the **backend API server** for a job portal application. It is a monolithic Express.js server with MongoDB, Redis, and AWS integrations.

## Tech Stack

- **Node.js 24** + **TypeScript 5.2** (CommonJS output)
- **Express.js 4** (web framework)
- **Mongoose 7** (MongoDB ODM)
- **Redis 4** (caching)
- **JWT** (authentication via jsonwebtoken)
- **bcryptjs** (password hashing)
- **Zod 4 + Yup** (request validation — Zod for new routes, Yup for legacy)
- **AWS SES** (email), **AWS S3** (file storage), **CloudWatch** (logging)
- **Jest 29** + **supertest** (testing, currently no test files)
- **Docker** + **AWS CodeDeploy/CodeBuild** (deployment)

## Directory Structure

```
src/
├── server.ts               # Entry point — creates HTTP server
├── app.ts                  # Express app factory (middleware, routes, error handler)
├── appRoutes.ts            # Top-level route registration
├── cacheDB/                # Redis connection
├── constants/              # Enums (job, SMS, store)
├── controllers/            # Business logic (otp, user)
├── database/
│   ├── createConnection.ts # Mongoose connection
│   └── models/             # Mongoose schemas (admin, company, job, jobApplication, jobCategory, otp, user)
├── middlewares/             # authenticator, errorHandler, inputValidator, ipBlacklist, rateLimiter
├── routes/api/             # Route definitions
│   ├── admin/v4/           # Admin routes
│   ├── job/v1/             # Company, job, jobApplication, jobCategory routes
│   └── user/userRouter/v4/ # User auth, OAuth, profile routes
├── services/emailer/       # AWS SES email service
├── settings/               # Centralized config from env vars
├── types/                  # Express & Socket.IO type augmentations
├── util/                   # Helpers, string utils, winston logger, S3/media utils
└── validators/             # Zod/Yup schemas for request validation
```

## Key Commands

| Command | Description |
|---------|-------------|
| `yarn dev` | Start dev server with nodemon (ts-node-dev) |
| `yarn build` | Compile TypeScript to `build/` |
| `yarn start` | Run compiled JS (`node build/server.js`) |
| `yarn lint` | Run ESLint |
| `yarn test` | Run Jest tests (currently none exist) |
| `yarn migrate:up` | Run database migrations |

## Code Conventions

- Route handlers contain most business logic (thin controller layer)
- New route validations use **Zod** (`flatZodInputValidator` middleware)
- Legacy validations use **Yup** (`flatYupInputValidator` middleware)
- Company-scoped resources use `:companyIdOrUsername` URL param (supports ObjectId or slug)
- Auth middleware: `authenticator("user")`, `authenticator("min-admin")`, `authenticator("super-admin")`
- API prefix: `/api/` for all routes
- JWT tokens use `Authorization: JWT <token>` header format (not `Bearer`)
- Output directory: `build/` (not `dist/`)

## When Modifying Code

1. New routes go in `src/routes/api/<domain>/v<version>/`
2. New validators go in `src/validators/<domain>/`
3. New Mongoose models go in `src/database/models/<model>/`
4. Environment variables are centralized in `src/settings/config.ts`
5. Run `yarn lint` before committing
6. The server runs on port `7000` (configurable via `PORT` env var)

## Environment Setup

Copy `.env.template` to `.env` and fill in:
- `DB_URL` — MongoDB connection string
- `REDIS_URL` — Redis connection string
- `CLIENT_SECRET` / `ADMIN_SECRET` — JWT secrets
- AWS credentials for SES, S3, CloudWatch
- `GOOGLE_CLIENT_ID` — Google OAuth

## Plans

Feature plans are written and maintained in the `plans/` folder:

- **Frontend plans**: `job-portal-monorepo/plans/` (sibling repo)
- **Backend plans**: `job-portal-server/plans/` (this repo)

### Mandatory: Update Plans on Every Feature Change

**Every time a feature is added, modified, or removed, the corresponding plan file MUST be created or updated to reflect the actual implementation.** This applies to both frontend and backend changes.

Rules:
1. **Before implementing**: Write or update the plan file with the intended changes
2. **After implementing**: Update the plan file to match what was actually built (models, routes, validators, API endpoints, design decisions)
3. Plans must document: overview, design decisions, API mapping, types, file list, and implementation phases
4. Keep plan files as the **source of truth** for what exists in the codebase
5. Update ARCHITECTURE.md and this file if the plan adds new patterns or conventions
