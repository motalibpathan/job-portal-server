# Public Website API — Backend

## Overview

Create dedicated public (unauthenticated) API endpoints for the job portal website (`job-portal-user`). The website has 3 pages: landing, company profile, job detail with application form. Each page needs its own API.

## Endpoints

| # | Method | Route | Purpose | Page |
|---|--------|-------|---------|------|
| 1 | GET | `/api/public/companies/:userName` | Company profile + active jobs + categories | Company profile page |
| 2 | GET | `/api/public/companies/:userName/jobs/:slug` | Single job detail + application form | Job detail page |
| 3 | POST | `/api/public/companies/:userName/jobs/:slug/upload-document` | Upload resume/document | Job detail page (application form) |
| 4 | POST | `/api/public/companies/:userName/jobs/:slug/apply` | Submit application | Job detail page (application form) |

Landing page reuses existing `GET /api/jobs` (public job search).

---

## Endpoint Details

### 1. GET /api/public/companies/:userName

Returns company info, all active jobs, and job categories for filter UI.

**Params:** `userName` — company username slug

**Response 200:**
```json
{
  "company": {
    "_id": "...",
    "name": "Acme Corp",
    "userName": "acme",
    "logoUrl": "https://...",
    "description": "We build great products",
    "websiteUrl": "https://acme.com"
  },
  "jobs": [
    {
      "_id": "...",
      "title": "Frontend Developer",
      "slug": "frontend-developer",
      "category": { "categoryId": "...", "categoryName": "Engineering" },
      "country": "USA",
      "remoteOption": "remote",
      "employmentType": "full-time",
      "description": "We are looking for...",
      "createdAt": "2026-08-20T..."
    }
  ],
  "categories": [
    { "_id": "...", "name": "Engineering" },
    { "_id": "...", "name": "Design" }
  ]
}
```

**Logic:**
1. Find company by `userName`
2. If not found → 404 `{ "message": "Company not found" }`
3. Find all jobs where `companyId = company._id` AND `status = "active"`, sorted by `createdAt` desc
4. Find all categories where `companyId = company._id`
5. Return company (subset: name, userName, logoUrl, description, websiteUrl), jobs, categories

**No auth required.**

---

### 2. GET /api/public/companies/:userName/jobs/:slug

Returns full job detail including application form fields and company info.

**Params:** `userName` — company username, `slug` — job slug

**Response 200:**
```json
{
  "job": {
    "_id": "...",
    "title": "Frontend Developer",
    "slug": "frontend-developer",
    "description": "<p>We are looking for a frontend developer...</p>",
    "category": { "categoryId": "...", "categoryName": "Engineering" },
    "country": "USA",
    "remoteOption": "remote",
    "employmentType": "full-time",
    "applicationForm": [
      { "fieldId": "name", "label": "Full Name", "fieldType": "short-text", "required": true, "order": 0 },
      { "fieldId": "email", "label": "Email", "fieldType": "email", "required": true, "order": 1 },
      { "fieldId": "resume", "label": "Resume", "fieldType": "document-upload", "required": true, "order": 2 },
      { "fieldId": "coverLetter", "label": "Cover Letter", "fieldType": "document-upload", "required": false, "order": 3 }
    ],
    "createdAt": "2026-08-20T..."
  },
  "company": {
    "name": "Acme Corp",
    "userName": "acme",
    "logoUrl": "https://...",
    "websiteUrl": "https://acme.com"
  }
}
```

**Logic:**
1. Find company by `userName`
2. If not found → 404 `{ "message": "Company not found" }`
3. Find job where `slug = :slug` AND `companyId = company._id` AND `status = "active"`
4. If not found → 404 `{ "message": "Job not found" }`
5. Return job (including applicationForm) + company subset

**No auth required.**

---

### 3. POST /api/public/companies/:userName/jobs/:slug/upload-document

Upload a file (resume, cover letter, etc.) before submitting application. Two-step process: upload first, get URL, then submit application with URL as answer value.

**Params:** `userName`, `slug`

**Request:** `multipart/form-data` with file fields named by `fieldId` (e.g., `resume`, `coverLetter`)

**Constraints:**
- Allowed MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (.docx), `application/msword` (.doc)
- Max size: 10 MB per file

**Response 200:**
```json
{
  "resume": "https://storage.example.com/job-applications/.../resume.pdf",
  "coverLetter": "https://storage.example.com/job-applications/.../cover-letter.pdf"
}
```

**Logic:**
1. Validate company exists, job exists and belongs to company, job is active
2. Validate each file (mime type, size)
3. Upload all files in parallel to storage
4. Return `{ [fieldId]: url }` map

**No auth required.**

---

### 4. POST /api/public/companies/:userName/jobs/:slug/apply

Submit a job application.

**Params:** `userName`, `slug`

**Request body:**
```json
{
  "answers": [
    { "fieldId": "name", "value": "John Doe" },
    { "fieldId": "email", "value": "john@example.com" },
    { "fieldId": "resume", "value": "https://storage.example.com/.../resume.pdf" }
  ]
}
```

**Optional:** `Authorization: Bearer <token>` header. If present and valid user JWT, attaches `applicantId` for duplicate detection.

**Response 201:**
```json
{
  "application": {
    "_id": "...",
    "jobId": "...",
    "status": "submitted",
    "createdAt": "2026-08-20T..."
  }
}
```

**Error responses:**
- 400 — validation error (missing/empty answers)
- 404 — company or job not found
- 409 — user already applied (only if JWT provided)

**Logic:**
1. Find company by `userName`
2. Find job by `slug` + `companyId`, verify `status = "active"`
3. Validate answers array (at least 1 answer, each has fieldId + value)
4. If Authorization header present, decode JWT, extract `userId` as `applicantId`
5. If `applicantId` exists, check for duplicate application → 409 if exists
6. Create JobApplication document
7. Return 201 with application info

---

## File Structure

```
src/routes/api/job/v1/publicApi.ts    ← NEW — all 4 endpoints
src/routes/api/job/index.ts           ← MODIFY — add router.use(publicApi)
```

No model changes needed. No enum changes needed. No validator changes needed (reuse existing `submitApplicationBodySchema`).

---

## Implementation Steps

| Step | Task | Status |
|------|------|--------|
| 1 | Create `src/routes/api/job/v1/publicApi.ts` with helper functions (resolveCompany) | Pending |
| 2 | Implement `GET /api/public/companies/:userName` | Pending |
| 3 | Implement `GET /api/public/companies/:userName/jobs/:slug` | Pending |
| 4 | Implement `POST /api/public/companies/:userName/jobs/:slug/upload-document` | Pending |
| 5 | Implement `POST /api/public/companies/:userName/jobs/:slug/apply` | Pending |
| 6 | Mount `publicApi` in `src/routes/api/job/index.ts` | Pending |
| 7 | Test all endpoints with curl/Postman | Pending |
| 8 | Commit and push | Pending |
