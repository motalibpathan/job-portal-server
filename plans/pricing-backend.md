# Pricing Implementation — Backend

## Overview

Add subscription/pricing system at the company level. Enforce plan limits on job creation and team members. Payment integration deferred.

## Plan Tiers

| Plan       | Price/mo | Active Job Limit | Team Members |
|------------|----------|------------------|--------------|
| Free       | $0       | 2                | 0            |
| Bootstrap  | $29      | 3                | Unlimited    |
| Startup    | $49      | 10               | Unlimited    |
| Business   | $129     | 20               | Unlimited    |

## Data Model Changes

### Company model — add fields
- `plan`: String enum (`free` | `bootstrap` | `startup` | `business`), default `"free"`
- `planExpiresAt`: optional Date

### Job model — add field
- `status`: String enum (`active` | `draft` | `closed`), default `"active"`

### New Subscription model
- `companyId`: ObjectId (ref companies), required
- `plan`: String, required
- `billingCycle`: String enum (`monthly` | `yearly`), required
- `amount`: Number, required (cents)
- `status`: String enum (`active` | `cancelled` | `expired`), required
- `startDate`: Date, required
- `endDate`: Date, required
- timestamps: true

## Enums (constants/jobEnums.ts)

```
COMPANY_PLAN       { FREE: "free", BOOTSTRAP: "bootstrap", STARTUP: "startup", BUSINESS: "business" }
JOB_STATUS         { ACTIVE: "active", DRAFT: "draft", CLOSED: "closed" }
SUBSCRIPTION_STATUS { ACTIVE: "active", CANCELLED: "cancelled", EXPIRED: "expired" }
BILLING_CYCLE      { MONTHLY: "monthly", YEARLY: "yearly" }
```

Plan config constant:
```ts
export const PLAN_CONFIG = {
  free:      { price: 0,   activeJobLimit: 2,  teamMembers: 1 },
  bootstrap: { price: 29,  activeJobLimit: 3,  teamMembers: Infinity },
  startup:   { price: 49,  activeJobLimit: 10, teamMembers: Infinity },
  business:  { price: 129, activeJobLimit: 20, teamMembers: Infinity },
} as const;
```

## Backend API Routes

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/company/:userName/billing/subscription` | Get current subscription + plan info |
| GET | `/company/:userName/billing/transactions` | List transaction history |

## Enforcement

- Job creation: check `activeJobsCount < plan.activeJobLimit`
- Team invite: free plan = 0 members, block invite generation + join with 403

## Files

| File | Change |
|------|--------|
| `job-portal-server/src/database/models/company/company.ts` | Add plan, planExpiresAt |
| `job-portal-server/src/database/models/job/job.ts` | Add status field |
| `job-portal-server/src/database/models/subscription/subscription.ts` | New model |
| `job-portal-server/src/constants/jobEnums.ts` | Add enums + PLAN_CONFIG |

## Status

| Step | Status |
|------|--------|
| Create plan file | Done |
| Company model changes | Pending |
| Job model changes | Pending |
| Subscription model | Pending |
| Enums + PLAN_CONFIG | Pending |
| API routes | Pending |
