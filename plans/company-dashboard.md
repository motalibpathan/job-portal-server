# Company Dashboard - Backend Plan

## Overview

Backend changes to support the company dashboard frontend. Categories become per-company, stats endpoint added, default categories seeded on company creation, jobs use slugs in URLs.

## Changes Required

### 1. JobCategory Model - Add companyId field

File: `src/database/models/jobCategory/jobCategory.ts`

Add optional companyId field to make categories per-company.

- companyId is optional -- null means global admin category
- When set, category belongs to that specific company
- Index on `{ companyId: 1, name: 1 }` for efficient per-company queries

### 2. Seed Default Categories on Company Creation

File: `src/routes/api/job/v1/companyApi.ts`

After creating a company in `POST /api/companies`, insert 8 default categories.

Default categories:
1. IT & Software Development
2. Sales & Marketing
3. Administration & Operations
4. Customer Service
5. Design & Creative
6. Finance & Accounting
7. Human Resources
8. Legal

Also seed categories for `POST /api/signup-with-company`.

### 3. New Stats Endpoint

File: `src/routes/api/job/v1/jobApi.ts`

Endpoint: `GET /api/:companyIdOrUsername/stats`
Auth: `user | min-admin`
Response: `{ totalJobs, activeJobs, closedJobs, totalApplications, applicationsByStatus, recentApplications }`

### 4. Job Slugs

All company-scoped job routes use human-readable slugs instead of MongoDB ObjectIds in URLs.

**Model changes** (`src/database/models/job/job.ts`):
- Add `slug: string` field (required, trimmed)
- Add compound unique index `{ companyId: 1, slug: 1 }` — slug unique per company

**Slug generation** (`src/util/stringUtils.ts`):
- `generateJobSlug(title)` — converts title to kebab-case
  - `"Frontend Developer (Mid)"` → `"frontend-developer-mid"`
  - `"Senior React Engineer!"` → `"senior-react-engineer"`

**Uniqueness** (`src/routes/api/job/v1/jobApi.ts`):
- `generateUniqueJobSlug(companyId, title, excludeJobId?)` — appends `-1`, `-2`, etc. on collision
- Called on create (auto-generate) and on update (when title changes)

**Route changes** (`src/routes/api/job/v1/jobApi.ts`):

| Route | Before | After |
|-------|--------|-------|
| Create | `Job.create({ ...body, companyId })` | Auto-generate slug, `Job.create({ ...body, slug, companyId })` |
| Get Single | `Job.findOne({ _id: jobId, companyId })` | `Job.findOne({ slug, companyId })` |
| Update | `Job.findOneAndUpdate({ _id: jobId, companyId })` | Find by slug, regenerate slug if title changed |
| Delete | `Job.findOneAndDelete({ _id: jobId, companyId })` | `Job.findOneAndDelete({ slug, companyId })` |
| Stages | `Job.findOneAndUpdate({ _id: jobId, companyId })` | `Job.findOneAndUpdate({ slug, companyId })` |
| App Form | `Job.findOneAndUpdate({ _id: jobId, companyId })` | `Job.findOneAndUpdate({ slug, companyId })` |

**Application routes** (`src/routes/api/job/v1/jobApplicationApi.ts`):
- All company-scoped application routes resolve job by `{ slug, companyId }` first, then use `job._id` for JobApplication queries (since JobApplication stores ObjectId references)

**Validator changes** (`src/validators/job/jobValidator.ts`):
- `jobIdParamSchema`: change from `getZodMongoId()` to `z.string().min(1)` (accepts slug strings)
- `publicJobIdParamSchema`: unchanged (public routes still use ObjectId for now)

### 5. Update Job Category Routes

File: `src/routes/api/job/v1/jobCategoryApi.ts`

- `GET /api/companies/:companyIdOrUsername/job-categories` — filter by companyId
- `POST /api/companies/:companyIdOrUsername/job-categories` — auto-assign companyId from auth
- `PUT /api/job-categories/:categoryId` — verify ownership
- `DELETE /api/job-categories/:categoryId` — verify ownership

### 6. Update Job Category Validator

File: `src/validators/job/jobCategoryValidator.ts`

- Add companyId to create schema (optional, auto-assigned from auth)
- Add companyId to query filter schema

### 7. Company CRUD Endpoints

File: `src/routes/api/job/v1/companyApi.ts`

- `PUT /api/companies/:userName` — update company info (name, description, logo, website)
- `DELETE /api/companies/:userName` — delete company and all associated data

---

---

## Implementation Order

1. Update JobCategory model (add companyId)
2. Update jobCategoryValidator (add companyId support)
3. Update jobCategoryApi routes (filter by companyId, verify ownership)
4. Update companyApi (seed categories on create + signup-with-company, add update/delete endpoints)
5. Add stats endpoint to jobApi
6. Add slug field to Job model + unique index
7. Add generateJobSlug to stringUtils
8. Update jobIdParamSchema to accept slug strings
9. Update jobApi routes (create auto-slug, lookup by slug, update slug on title change)
10. Update jobApplicationApi routes (resolve job by slug)
