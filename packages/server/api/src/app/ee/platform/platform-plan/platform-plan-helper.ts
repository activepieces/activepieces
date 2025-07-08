import { ActivepiecesError, ApEdition, ErrorCode, FlowStatus, isNil, PlatformPlanLimits, PlatformUsageMetric, UserStatus } from '@activepieces/shared'
import { flowService } from '../../../flows/flow/flow.service'
import { system } from '../../../helper/system/system'
import { projectService } from '../../../project/project-service'
import { userService } from '../../../user/user-service'
import { platformUsageService } from '../platform-usage-service'
import { platformPlanService } from './platform-plan.service'

const edition = system.getEdition()

type QuotaCheckParams = {
    platformId: string
    projectId?: string
    metric: Exclude<PlatformUsageMetric, PlatformUsageMetric.AI_TOKENS | PlatformUsageMetric.TASKS>
}

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


export async function checkQuotaOrThrow(params: QuotaCheckParams): Promise<void> {
    const { platformId, projectId, metric } = params

    if (![ApEdition.ENTERPRISE, ApEdition.CLOUD].includes(edition)) {
        return
    }

    await checkProjectNotLockedOrThrow(projectId) 

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
}

export async function checkProjectNotLockedOrThrow(projectId?: string): Promise<void> {
    if (!isNil(projectId)) {
        const project = await projectService.getOneOrThrow(projectId)

        if (project.locked) {
            throw new ActivepiecesError({
                code: ErrorCode.PROJECT_LOCKED,
                params: {
                    message: 'Project is locked',
                },
            })
        }
    }
}

type HandleResourceLockingAndUnlockingParams = {
    platformId: string
    newLimits: Partial<PlatformPlanLimits>
}

export async function handleResourceLocking({ platformId, newLimits }: HandleResourceLockingAndUnlockingParams): Promise<void> {
    const usage = await platformUsageService(system.globalLogger()).getAllPlatformUsage(platformId)

    const projectIds = await projectService.getProjectIdsByPlatform(platformId)
    const lockedProjectIds = await handleProjects(projectIds, usage.projects, newLimits.projectsLimit)

    await handleActiveFlows(projectIds, lockedProjectIds, usage.activeFlows, newLimits.activeFlowsLimit)
    await handleUserSeats(projectIds, lockedProjectIds, usage.seats, platformId, newLimits.userSeatsLimit)
}

async function handleProjects(projectIds: string[], currentUsage: number, newLimit?: number): Promise<string[]> {
    if (isNil(newLimit)) return []
    
    if (currentUsage > newLimit) {
        const projectsToLock = projectIds.slice(newLimit)
        for (const projectId of projectsToLock) {
            await projectService.update(projectId, { locked: true })
        }
        return projectsToLock
    }

    for (const projectId of projectIds) {
        await projectService.update(projectId, { locked: false })
    }

    return []
}

async function handleActiveFlows(
    projectIds: string[], 
    lockedProjectIds: string[], 
    currentUsage: number,
    newLimit?: number, 
): Promise<void> {
    if (isNil(newLimit) || currentUsage <= newLimit) return
    
    const numFlowsToDisable = currentUsage - newLimit
    let disabledCount = 0
    
    for (const projectId of lockedProjectIds) {
        if (disabledCount >= numFlowsToDisable) break
        
        const enabledFlows = await flowService(system.globalLogger()).list({
            projectId, 
            cursorRequest: null, 
            limit: 1000, 
            folderId: undefined, 
            name: undefined, 
            status: [FlowStatus.ENABLED], 
            connectionExternalIds: undefined,
        })
        
        for (const flow of enabledFlows.data) {
            if (disabledCount >= numFlowsToDisable) break
            
            await flowService(system.globalLogger()).updateStatus({
                id: flow.id,
                projectId: flow.projectId,
                newStatus: FlowStatus.DISABLED,
            })
            disabledCount++
        }
    }
    
    if (disabledCount < numFlowsToDisable) {
        const unlockedProjectIds = projectIds.filter(id => !lockedProjectIds.includes(id))
        
        for (const projectId of unlockedProjectIds) {
            if (disabledCount >= numFlowsToDisable) break
            
            const enabledFlows = await flowService(system.globalLogger()).list({
                projectId, 
                cursorRequest: null, 
                limit: 1000, 
                folderId: undefined, 
                name: undefined, 
                status: [FlowStatus.ENABLED], 
                connectionExternalIds: undefined,
            })
            
            for (const flow of enabledFlows.data) {
                if (disabledCount >= numFlowsToDisable) break
                
                await flowService(system.globalLogger()).updateStatus({
                    id: flow.id,
                    projectId: flow.projectId,
                    newStatus: FlowStatus.DISABLED,
                })
                disabledCount++
            }
        }
    }
}

async function handleUserSeats(
    projectIds: string[], 
    lockedProjectIds: string[], 
    currentUsage: number,
    platformId: string,
    newLimit?: number,
): Promise<void> {
    if (isNil(newLimit)) return

    if (currentUsage > newLimit) {
        const numUsersToDeactivate = currentUsage - newLimit
        let deactivatedCount = 0

        for (const projectId of lockedProjectIds) {
            if (deactivatedCount >= numUsersToDeactivate) break

            const projectUsers = await userService.listProjectUsers({
                projectId, 
                platformId,
            })
            const activeUsers = projectUsers.filter(user => user.status !== UserStatus.INACTIVE)

            for (const activeUser of activeUsers) {
                if (deactivatedCount >= numUsersToDeactivate) break

                await userService.update({
                    id: activeUser.id,
                    status: UserStatus.INACTIVE,
                    platformId,
                })
                deactivatedCount++
            }
        }

        if (deactivatedCount < numUsersToDeactivate) {
            const unlockedProjectIds = projectIds.filter(id => !lockedProjectIds.includes(id))

            for (const projectId of unlockedProjectIds) {
                if (deactivatedCount >= numUsersToDeactivate) break
                const projectUsers = await userService.listProjectUsers({
                    projectId, 
                    platformId,
                })
                const activeUsers = projectUsers.filter(user => user.status !== UserStatus.INACTIVE)

                for (const activeUser of activeUsers) {
                    if (deactivatedCount >= numUsersToDeactivate) break

                    await userService.update({
                        id: activeUser.id,
                        status: UserStatus.INACTIVE,
                        platformId,
                    })
                    deactivatedCount++
                }
            }
        }
    }
}