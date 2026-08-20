# Team Members - Backend Plan

## Overview

Owner invites team members via a single-use invite link. Team members get full dashboard access except managing members and deleting company.

## Invite Flow

1. Logged-in user clicks invite link → joins team → redirected to company dashboard
2. Not logged-in user clicks invite link → redirected to login (with ?redirectTo=...) → user chooses login or register → after auth → auto-joins team → goes to company dashboard

## 1. TeamInvite Model (new file)

File: `src/database/models/teamInvite/teamInvite.ts`

```ts
{
  token: string        // random 32-char hex, unique, indexed
  companyId: ObjectId  // ref: companies
  createdBy: ObjectId  // ref: users (owner who generated)
  usedBy: ObjectId     // ref: users (nullable)
  expiresAt: Date      // TTL index — MongoDB auto-deletes expired docs
  createdAt: Date
}
```

## 2. Company Model - Add teamMemberUserIds

File: `src/database/models/company/company.ts`

Add: `teamMemberUserIds: [{ type: Schema.Types.ObjectId, ref: "users" }]`
Update `ICompanyModel` interface.

## 3. Auth Middleware - Allow Team Members

File: `src/middlewares/authenticator.ts`

Change: find company by userName/Id only (remove creatorUserId filter), then check owner OR team member. If neither → 401.

## 4. Team API Routes

File: `src/routes/api/job/v1/companyApi.ts`

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/companies/:userName/team` | owner or member | List team with user details |
| `POST` | `/companies/:userName/team/invite` | owner only | Generate single-use invite link |
| `POST` | `/companies/:userName/team/join` | user | Accept invite via token |

- GET: populate creatorUserId as owner, teamMemberUserIds as members
- POST invite: generate 32-char hex token, store in TeamInvite (expires: 3 days), return { url }
- POST join: validate token (not expired, not used), add user to teamMemberUserIds, mark invite used

## 5. Update Ownership Checks

File: `src/routes/api/job/v1/jobCategoryApi.ts`

Replace `creatorUserId.equals()` with helper that checks owner OR team member.

## 6. Validator

File: `src/validators/job/companyValidator.ts`

Add: `joinTeamBodySchema = z.object({ token: z.string().min(1) })`

## Files

| File | Action |
|------|--------|
| `src/database/models/teamInvite/teamInvite.ts` | New |
| `src/database/models/company/company.ts` | Add teamMemberUserIds |
| `src/middlewares/authenticator.ts` | Allow team members |
| `src/validators/job/companyValidator.ts` | Add joinTeamBodySchema |
| `src/routes/api/job/v1/companyApi.ts` | Add team routes |
| `src/routes/api/job/v1/jobCategoryApi.ts` | Relax ownership checks |

## Implementation Order

1. Create TeamInvite model — Done
2. Add teamMemberUserIds to Company model — Done
3. Update authenticator middleware — Done
4. Add team validator schema — Done
5. Add team API routes — Done
6. Update jobCategoryApi ownership checks — Done
