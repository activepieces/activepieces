import { METRIC_TO_LIMIT_MAPPING, METRIC_TO_USAGE_MAPPING, RESOURCE_TO_MESSAGE_MAPPING } from '@activepieces/ee-shared'
import { ActivepiecesError, ApEdition, ErrorCode, FlowStatus, isNil, PlatformPlanLimits, PlatformUsageMetric, UserStatus } from '@activepieces/shared'
import { flowService } from '../../../flows/flow/flow.service'
import { system } from '../../../helper/system/system'
import { projectService } from '../../../project/project-service'
import { userService } from '../../../user/user-service'
import { projectLimitsService } from '../../projects/project-plan/project-plan.service'
import { platformUsageService } from '../platform-usage-service'
import { platformPlanService } from './platform-plan.service'

const edition = system.getEdition()

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
    checkResourceLocked: async (params: CheckResourceLockedParams): Promise<void> => {
        const { platformId, resource } = params

        if (![ApEdition.ENTERPRISE, ApEdition.CLOUD].includes(edition)) {
            return
        }

        const plan = await platformPlanService(system.globalLogger()).getOrCreateForPlatform(platformId)
        const platformUsage = await platformUsageService(system.globalLogger()).getAllPlatformUsage(platformId)

        const limitKey = METRIC_TO_LIMIT_MAPPING[resource]
        const usageKey = METRIC_TO_USAGE_MAPPING[resource]

        if (!limitKey || !usageKey) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: `Unknown resource: ${resource}`,
                },
            })
        }

        const limit = plan[limitKey]
        const currentUsage = platformUsage[usageKey]

        if (!isNil(limit) && currentUsage > limit) {
            throw new ActivepiecesError({
                code: ErrorCode.RESOURCE_LOCKED,
                params: {
                    message: RESOURCE_TO_MESSAGE_MAPPING[resource],
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
    projectId?: string
    platformId: string
    metric: Exclude<PlatformUsageMetric, PlatformUsageMetric.AI_CREDITS | PlatformUsageMetric.TASKS>
}

type CheckResourceLockedParams = {
    platformId: string
    resource: Exclude<PlatformUsageMetric, PlatformUsageMetric.AI_CREDITS | PlatformUsageMetric.TASKS | PlatformUsageMetric.USER_SEATS | PlatformUsageMetric.ACTIVE_FLOWS>
}