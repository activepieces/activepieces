import { ActivepiecesError, ApEdition, ErrorCode, isNil, PlatformUsageMetric } from '@activepieces/shared'
import { system } from '../../../helper/system/system'
import { platformUsageService } from '../platform-usage-service'
import { platformPlanService } from './platform-plan.service'

type QuotaCheckParams = {
    platformId: string
    metric: PlatformUsageMetric
}

const METRIC_TO_LIMIT_MAPPING = {
    [PlatformUsageMetric.TASKS]: 'tasksLimit',
    [PlatformUsageMetric.AI_TOKENS]: 'aiCreditsLimit',
    [PlatformUsageMetric.ACTIVE_FLOWS]: 'activeFlowsLimit',
    [PlatformUsageMetric.USER_SEATS]: 'userSeatsLimit',
    [PlatformUsageMetric.PROJECTS]: 'projectsLimit',
    [PlatformUsageMetric.TABLES]: 'tablesLimit',
} as const

const METRIC_TO_USAGE_MAPPING = {
    [PlatformUsageMetric.TASKS]: 'tasks',
    [PlatformUsageMetric.AI_TOKENS]: 'aiCredits',
    [PlatformUsageMetric.ACTIVE_FLOWS]: 'activeFlows',
    [PlatformUsageMetric.USER_SEATS]: 'seats',
    [PlatformUsageMetric.PROJECTS]: 'projects',
    [PlatformUsageMetric.TABLES]: 'tables',
} as const

const edition = system.getEdition()

export async function checkQuotaOrThrow(params: QuotaCheckParams): Promise<void> {
    if (![ApEdition.ENTERPRISE, ApEdition.CLOUD].includes(edition)) {
        return;
    }
    const { platformId, metric } = params

    const plan = await platformPlanService(system.globalLogger()).getOrCreateForPlatform(platformId)
    const platformUsage = await platformUsageService(system.globalLogger()).getPlatformUsage(platformId)

    const limitKey = METRIC_TO_LIMIT_MAPPING[metric]
    const usageKey = METRIC_TO_USAGE_MAPPING[metric]

    if (!limitKey || !usageKey) {
        throw new ActivepiecesError({
            code: ErrorCode.VALIDATION,
            params: {
                message: `Unknown metric: ${metric}`,
            },
        })
    }

    const limit = plan[limitKey]
    const currentUsage = platformUsage[usageKey]

    if (!isNil(limit) && currentUsage >= limit) {
        throw new ActivepiecesError({
            code: ErrorCode.QUOTA_EXCEEDED,
            params: {
                metric,
            },
        })
    }
}