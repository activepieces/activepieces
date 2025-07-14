import { ActivepiecesError, ApEdition, ErrorCode, FlowStatus, isNil, PlatformPlanLimits, PlatformUsageMetric, UserStatus } from '@activepieces/shared'
import { flowService } from '../../../flows/flow/flow.service'
import { system } from '../../../helper/system/system'
import { projectService } from '../../../project/project-service'
import { userService } from '../../../user/user-service'
import { projectLimitsService } from '../../projects/project-plan/project-plan.service'
import { platformUsageService } from '../platform-usage-service'
import { platformPlanService } from './platform-plan.service'

const edition = system.getEdition()

const METRIC_TO_LIMIT_MAPPING = {
    [PlatformUsageMetric.ACTIVE_FLOWS]: 'activeFlowsLimit',
    [PlatformUsageMetric.USER_SEATS]: 'userSeatsLimit',
    [PlatformUsageMetric.PROJECTS]: 'projectsLimit',
    [PlatformUsageMetric.TABLES]: 'tablesLimit',
    [PlatformUsageMetric.MCPS]: 'mcpLimit',
    [PlatformUsageMetric.AGENTS]: 'agentsLimit',
} as const

const METRIC_TO_USAGE_MAPPING = {
    [PlatformUsageMetric.ACTIVE_FLOWS]: 'activeFlows',
    [PlatformUsageMetric.USER_SEATS]: 'seats',
    [PlatformUsageMetric.PROJECTS]: 'projects',
    [PlatformUsageMetric.TABLES]: 'tables',
    [PlatformUsageMetric.MCPS]: 'mcps',
    [PlatformUsageMetric.AGENTS]: 'agents',
} as const

export const PlatformPlanHelper = {
    checkQuotaOrThrow: async (params: QuotaCheckParams): Promise<void> => {
        const { platformId, projectId, metric } = params

        if (![ApEdition.ENTERPRISE, ApEdition.CLOUD].includes(edition)) {
            return
        }

        if (!isNil(projectId)) {
            await projectLimitsService(system.globalLogger()).ensureProjectUnlockedAndGetPlatformPlan(projectId)
        }

        const plan = await platformPlanService(system.globalLogger()).getOrCreateForPlatform(platformId)
        const platformUsage = await platformUsageService(system.globalLogger()).getAllPlatformUsage(platformId)

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
    },
    handleResourceLocking: async ({ platformId, newLimits }: HandleResourceLockingParams): Promise<void> => {
        const usage = await platformUsageService(system.globalLogger()).getAllPlatformUsage(platformId)
        const projectIds = await projectService.getProjectIdsByPlatform(platformId)

        await handleProjects(projectIds, usage.projects, newLimits.projectsLimit)
        await handleActiveFlows(projectIds, usage.activeFlows, newLimits.activeFlowsLimit)
        await handleUserSeats(projectIds, usage.seats, platformId, newLimits.userSeatsLimit)
    },
}

async function handleProjects(projectIds: string[], currentUsage: number, newLimit?: number): Promise<void> {
    if (isNil(newLimit)) return 

    if (currentUsage > newLimit) {
        const projectsToLock = projectIds.slice(newLimit)
        const lockProjects = projectsToLock.map(id => projectLimitsService(system.globalLogger()).upsert({ locked: true }, id))
        await Promise.all(lockProjects)
        return
    }

    const unlockProjects = projectIds.map(id => projectLimitsService(system.globalLogger()).upsert({ locked: false }, id))
    await Promise.all(unlockProjects)
}

async function handleActiveFlows(
    projectIds: string[], 
    currentUsage: number,
    newLimit?: number, 
): Promise<void> {
    if (isNil(newLimit) || currentUsage <= newLimit) return

    const getAllEnabledFlows = projectIds.map(id => {
        return flowService(system.globalLogger()).list({
            projectId: id, 
            cursorRequest: null, 
            limit: 10000, 
            folderId: undefined, 
            name: undefined, 
            status: [FlowStatus.ENABLED], 
            connectionExternalIds: undefined,
        })
    })

    const enabledFlows = (await Promise.all(getAllEnabledFlows)).flatMap(page => page.data)
    const flowsToDisable = enabledFlows.slice(newLimit)

    const disableFlows = flowsToDisable.map(flow => {
        return flowService(system.globalLogger()).updateStatus({
            id: flow.id,
            projectId: flow.projectId,
            newStatus: FlowStatus.DISABLED,
        })
    })

    await Promise.all(disableFlows)
}

async function handleUserSeats(
    projectIds: string[], 
    currentUsage: number,
    platformId: string,
    newLimit?: number,
): Promise<void> {
    if (isNil(newLimit) || currentUsage <= newLimit) return

    const getAllActiveUsers = projectIds.map(id => {
        return userService.listProjectUsers({
            projectId: id, 
            platformId,
        })
    })

    const activeUsers = (await Promise.all(getAllActiveUsers)).flatMap(user => user)
    const usersToDeactivate = activeUsers.slice(newLimit)

    const deactivateUsers = usersToDeactivate.map(user => {
        return userService.update({
            id: user.id,
            status: UserStatus.INACTIVE,
            platformId,
        })
    })

    await Promise.all(deactivateUsers)
}

type HandleResourceLockingParams = {
    platformId: string
    newLimits: Partial<PlatformPlanLimits>
}

type QuotaCheckParams = {
    platformId: string
    projectId?: string
    metric: Exclude<PlatformUsageMetric, PlatformUsageMetric.AI_TOKENS | PlatformUsageMetric.TASKS>
}