import { PlatformId, ProjectId } from '@activepieces/core-utils'

export const getPlatformPlanNameKey = (platformId: PlatformId): string => `platform_plan:plan:${platformId}`
export const getCreditsBalanceKey = (platformId: PlatformId): string => `platform_plan:credits:${platformId}`
export const getAppSumoAiCreditsBalanceKey = (platformId: PlatformId): string => `platform_plan:appsumo-ai-credits:${platformId}`
export const getBillingEnforcedKey = (platformId: PlatformId): string => `platform_plan:billing-enforced:${platformId}`
export const getEntitlementsRefreshKey = (platformId: PlatformId): string => `platform_plan:entitlements-refresh:${platformId}`
export const getEnrollAttemptKey = (platformId: PlatformId): string => `platform_plan:autumn-enroll-attempt:${platformId}`
export const getProjectConcurrencyPoolKey = (projectId: ProjectId): string => `project:concurrency-pool:${projectId}` // gets pool id for the project
export const getConcurrencyPoolLimitKey = (poolId: string): string => `concurrency-pool:limit:${poolId}` // gets limit value for the pool
export const getConcurrencyPoolSetKey = (poolId: string): string => `active_jobs_set:pool:${poolId}`
