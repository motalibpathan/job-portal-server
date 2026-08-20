# ARCHITECTURE.md - Job Portal Server

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Clients                             │
│   user-ui (3004)  ·  admin-ui (3003)  ·  Mobile/Other   │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTP
┌─────────────────────────▼────────────────────────────────┐
│                   Express Server (7000)                   │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Morgan  │  │ CORS     │  │ Rate     │  │ IP       │ │
│  │ Logger  │  │          │  │ Limiter  │  │ Blacklist│ │
│  └─────────┘  └──────────┘  └──────────┘  └──────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Route Handlers                       │   │
│  │  /api/admin/*  /api/user/*  /api/companies/*     │   │
│  │  /api/jobs/*   /api/job-categories/*             │   │
│  └───────────────────┬──────────────────────────────┘   │
│                      │                                   │
│  ┌───────────────────▼──────────────────────────────┐   │
│  │          Middlewares                              │   │
│  │  authenticator · inputValidator · errorHandler    │   │
│  └───────────────────┬──────────────────────────────┘   │
└──────────────────────┼───────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │ MongoDB │   │  Redis  │   │  AWS    │
   │(Mongoose)│   │ (cache) │   │ S3/SES  │
   └─────────┘   └─────────┘   └─────────┘
```

## Data Models

### Entity Relationship

```
┌──────────┐       ┌──────────┐       ┌──────────────┐
│  Admin   │       │   User   │◄──┐   │    OTP       │
│──────────│       │──────────│   │   │──────────────│
│ name     │       │ name     │   │   │ type         │
│ username │       │ email    │   │   │ identifier   │
│ password │       │ password │   │   │ otp          │
│ level    │       │ google   │   │   │ createdAt    │
│ isVerified│      │ facebook │   │   └──────────────┘
└──────────┘       └────┬─────┘   │
                        │         │
                        │ owns    │
                        ▼         │
                   ┌──────────┐   │
                   │ Company  │   │
                   │──────────│   │
                   │ name     │   │
                   │ userName │   │
                   │ creatorUserId ─┘
                   │ logoUrl  │
                   └────┬─────┘
                        │ has many
                        ▼
                   ┌──────────┐       ┌──────────────┐
                   │   Job    │──────►│ JobCategory  │
                   │──────────│       │──────────────│
                   │ title    │       │ name         │
                   │ companyId│       └──────────────┘
                   │ category │
                   │ stages   │
                   │ appForm  │
                   └────┬─────┘
                        │ has many
                        ▼
                   ┌──────────────┐
                   │JobApplication│
                   │──────────────│
                   │ jobId        │
                   │ applicantId  │
                   │ answers      │
                   │ status       │
                   └──────────────┘
```

### Collections

| Collection | Key Fields | Indexes |
|------------|-----------|---------|
| `admins` | name, username, password (bcrypt), level (0=super, 1=admin, 2=editor) | — |
| `users` | name, email, password, google嵌入, facebook嵌入, profilePicture | email, phoneNumber, google.googleEmail |
| `companies` | name, userName (slug), creatorUserId, logoUrl | userName (unique) |
| `jobs` | title, companyId, category, description, country, remoteOption, employmentType, applicationForm[], stages[] | companyId+createdAt, categoryId+country+employmentType+remoteOption |
| `jobApplications` | jobId, applicantId, answers[], status (submitted/reviewing/rejected/hired) | jobId+createdAt, applicantId+createdAt |
| `jobCategories` | name | name (unique) |
| `otp` | type, identifier, otp, createdAt (auto-expires 160s) | — |

## Authentication System

### JWT Token Architecture

Two separate auth systems with independent secrets:

| | User Tokens | Admin Tokens |
|--|------------|--------------|
| Secret | `CLIENT_SECRET` | `ADMIN_SECRET` |
| Payload | `{ type:"user", userId, name?, email? }` | `{ type:"admin", adminId, username, level }` |
| Header | `Authorization: JWT <token>` | `Authorization: JWT <token>` |

### Auth Levels

```
authenticator("user")         → Regular user (company owner)
authenticator("min-admin")    → Platform admin (level 0 or 1)
authenticator("super-admin")  → Platform owner only (level 0)
```

For `user` auth with `:companyIdOrUsername` in route params, the middleware automatically:
1. Resolves the company from the URL param
2. Verifies the user owns that company
3. Attaches `req.company` to the request

### Auth Flows

#### Login
```
POST /api/login/check  { email }
  ├─ Returns { command: "login" } → user has password
  │   └─ POST /api/login  { email, password } → JWT tokens
  └─ Returns { command: "verify" } → user has no password (OTP flow)
      ├─ POST /api/login/verify  { email, otp } → JWT tokens
      └─ (or POST /api/login with otp+newPassword)
```

#### Signup
```
POST /api/signup/check  { email }  → sends OTP email
POST /api/signup  { email, otp, password, name }  → JWT tokens

// Or with company creation:
POST /api/signup-with-company  { email, otp, password, name, companyName, companyUserName }
```

#### Password Reset
```
POST /api/reset/check  { email }  → sends OTP email
POST /api/reset/verify  { email, otp }  → verifies OTP
POST /api/reset  { email, otp, newPassword }  → resets password
```

#### Google OAuth
```
POST /api/google/login  { credential }  → verifies Google ID token → JWT tokens
```

### Token Refresh
```
POST /api/token/refresh  { refreshToken } → new access + refresh tokens
```

## API Route Map

### Admin Routes (`/api/admin`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/signup` | Public | Create admin |
| POST | `/login` | Public | Admin login |
| POST | `/changepassword` | min-admin | Change password |
| POST | `/changepassword/super` | super-admin | Change any admin's password |
| GET | `/list` | super-admin | List all admins |
| GET | `/` | min-admin | Get own profile |
| PUT | `/verify/:adminId` | super-admin | Verify admin |
| DELETE | `/:adminId` | super-admin | Delete admin |
| PUT | `/edit` | min-admin | Edit profile |
| PUT | `/upgrade/super/:adminId` | super-admin | Upgrade to super |
| PUT | `/downgrade/super/:adminId` | super-admin | Downgrade from super |
| POST | `/token/refresh` | Public | Refresh tokens |

### User Routes (`/api/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/signup/check` | Public+RateLimit | Send signup OTP |
| POST | `/signup` | Public | Complete signup |
| POST | `/signup-with-company` | Public | Signup + create company |
| POST | `/login/check` | Public+RateLimit | Check email / send OTP |
| POST | `/login/verify` | Public | Verify login OTP |
| POST | `/login` | Public | Login with password |
| POST | `/reset/check` | Public+RateLimit | Send reset OTP |
| POST | `/reset/verify` | Public | Verify reset OTP |
| POST | `/reset` | Public | Reset password |
| POST | `/update/check` | user+RateLimit | Send update OTP |
| POST | `/update` | user | Update email |
| POST | `/google/login` | Public+RateLimit | Google OAuth |
| PUT | `/name` | user | Update display name |
| GET | `/` | user | Get profile |
| DELETE | `/` | user | Delete account |
| PUT | `/profilePicture` | user | Upload avatar (S3) |
| PUT | `/changePassword` | user | Change password |
| POST | `/token/refresh` | Public | Refresh tokens |

### Company Routes (`/api/companies`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | min-admin | List all companies (paginated) |
| GET | `/username/check` | Public | Check username availability |
| GET | `/me` | user | Get my company |
| GET | `/mine` | user | List my companies |
| POST | `/` | user | Create company |
| PUT | `/:companyIdOrUsername` | user/min-admin | Update company |
| DELETE | `/:companyIdOrUsername` | user/min-admin | Delete company + jobs + applications |
| GET | `/:companyIdOrUsername` | user/min-admin | Get single company |

### Job Routes (`/api/`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/jobs` | Public | Search jobs (filtered, paginated) |
| GET | `/jobs/:jobId` | Public | Get job detail |
| POST | `/:companyIdOrUsername/jobs` | user/min-admin | Create job |
| GET | `/:companyIdOrUsername/jobs` | Public | List company's jobs |
| GET | `/:companyIdOrUsername/jobs/:jobId` | Public | Get company's job |
| PUT | `/:companyIdOrUsername/jobs/:jobId` | user/min-admin | Update job |
| DELETE | `/:companyIdOrUsername/jobs/:jobId` | user/min-admin | Delete job |
| PUT | `/:companyIdOrUsername/jobs/:jobId/stages` | user/min-admin | Update hiring stages |
| PUT | `/:companyIdOrUsername/jobs/:jobId/application-form` | user/min-admin | Update application form |

### Job Application Routes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/:companyIdOrUsername/jobs/:jobId/applications/upload-document` | Public | Upload resume (S3) |
| POST | `/:companyIdOrUsername/jobs/:jobId/applications` | Public | Submit application |
| GET | `/:companyIdOrUsername/jobs/:jobId/applications` | user/min-admin | List applications (paginated) |
| GET | `/:companyIdOrUsername/jobs/:jobId/applications/:applicationId` | user/min-admin | Get application |
| PATCH | `/:companyIdOrUsername/jobs/:jobId/applications/:applicationId/status` | user/min-admin | Update status |
| DELETE | `/:companyIdOrUsername/jobs/:jobId/applications/:applicationId` | user/min-admin | Delete application |
| GET | `/me/applications` | user | Get my applications |
| GET | `/me/applications/:applicationId` | user | Get my application |
| DELETE | `/me/applications/:applicationId` | user | Withdraw application |

### Job Category Routes (`/api/job-categories`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | Public | List all categories |
| GET | `/:categoryId` | Public | Get category |
| POST | `/` | min-admin | Create category |
| PUT | `/:categoryId` | min-admin | Update category |
| DELETE | `/:categoryId` | min-admin | Delete category |

## Middleware Pipeline

Request flow through middleware (in order):

```
1. cookieParser()
2. express.urlencoded()
3. express.json({ limit: "200mb" })
4. cors({ origin: true, credentials: true })
5. Trust proxy
6. Morgan logger (custom format)
7. Route-specific middleware:
   ├─ Rate limiter (on auth endpoints)
   ├─ IP blacklist checker (on sensitive auth endpoints)
   ├─ Input validator (Yup or Zod schema)
   └─ Authenticator (JWT verification + role check)
8. Route handler
9. Global errorHandler (catches unhandled errors)
```

### Rate Limiters

| Name | Limit | Window | Used On |
|------|-------|--------|---------|
| `userAuthAPIsRateLimiter` | 40 req | 2 hours | Login/signup/reset check |
| `profileAuthAPIsRateLimiter` | 10 req | 60 min | Profile update check |
| `profileGeneralAPIsRateLimiter` | 60 req | 1 min | General profile ops |

## File Storage (AWS S3)

- **Profile pictures**: Uploaded via multer → resized with Sharp → stored in S3
- **Job application documents**: Uploaded via multer → stored in S3 (MIME type auto-detected)
- S3 bucket: `job-portal-dev` (configurable via `S3_BUCKET` env var)

## Email System (AWS SES)

- Uses AWS SES v2 with nodemailer transport
- Pre-built templates for verification codes
- Email types: signup OTP, login OTP, password reset OTP, email update OTP
- Sender addresses: `EMAIL_MAIN` and `EMAIL_NO_REPLY` env vars

## Logging

- **Winston** logger with two transports:
  - Console (development): colored, detailed format
  - AWS CloudWatch (production): JSON format, stream `v3`
- Controlled by `LOG_DEPLOY` env var: `console`, `cloud`, or `all`

## Deployment

### AWS (Primary)

```
CodeBuild → ECR (Docker image) → CodeDeploy → EC2 (Docker Compose)
                                              └─ Nginx reverse proxy
Secrets: AWS SSM Parameter Store (/job-portal/server/{staging|prod}/*)
```

### Docker

```dockerfile
FROM node:22.17.1-alpine (private ECR)
WORKDIR /app
yarn install --frozen-lockfile
yarn build
EXPOSE 7000
CMD ["yarn", "start"]
```

### Environment Separation

| Env var | Values | Purpose |
|---------|--------|---------|
| `DEPLOY` | `development` / `production` | Runtime mode |
| `LOG_DEPLOY` | `console` / `cloud` / `all` | Logging destination |

## Known State

- Test infrastructure (Jest + supertest + mongodb-memory-server) is set up but **no test files exist**
- `storeEnums.ts` contains legacy enums from a prior product (store/order/payment)
- Several npm dependencies are installed but unused in current source: `agenda`, `node-cron`, `firebase-admin`, `facebook-nodejs-business-sdk`, `@google/genai`, `exceljs`, `jspdf`, `sslcommerz-lts`
- Socket.IO is declared in type augmentations but no active WebSocket handlers exist in `src/`
- Dual validation libraries: Yup (legacy) and Zod (newer routes)
