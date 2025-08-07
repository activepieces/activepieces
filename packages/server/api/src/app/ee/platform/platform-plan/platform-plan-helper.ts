import { ApSubscriptionStatus, BillingCycle, METRIC_TO_LIMIT_MAPPING, METRIC_TO_USAGE_MAPPING, PLAN_HIERARCHY, PlanName, PRICE_ID_MAP, PRICE_NAMES, RESOURCE_TO_MESSAGE_MAPPING } from '@activepieces/ee-shared'
import { ActivepiecesError, ApEdition, ErrorCode, FlowStatus, isNil, PlatformPlanLimits, PlatformUsageMetric, UserStatus } from '@activepieces/shared'
import { flowService } from '../../../flows/flow/flow.service'
import { system } from '../../../helper/system/system'
import { projectService } from '../../../project/project-service'
import { userService } from '../../../user/user-service'
import { projectLimitsService } from '../../projects/project-plan/project-plan.service'
import { platformUsageService } from '../platform-usage-service'
import { platformPlanService } from './platform-plan.service'
import Stripe from 'stripe'
import { AppSystemProp } from '@activepieces/server-shared'

const edition = system.getEdition()
const stripeSecretKey = system.get(AppSystemProp.STRIPE_SECRET_KEY)

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
    checkLegitSubscriptionUpdateOrThrow: async (params: CheckLegitSubscriptionUpdateOrThrowParams) => {
        const { projectsAddon, userSeatsAddon, newPlan } = params

        const isNotBusinessPlan = newPlan !== PlanName.BUSINESS
        const requestUserSeatAddon = !isNil(userSeatsAddon)
        const requestProjectAddon = !isNil(projectsAddon)

        if (isNotBusinessPlan && (requestUserSeatAddon || requestProjectAddon)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: {
                    message: 'Extra users and projects are only available for the Business plan',
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
    isUpgradeExperience: (params: IsUpgradeEperienceParams): boolean => {
        const {
            currentActiveFlowsLimit,
            currentPlan,
            currentProjectsLimit,
            currentUserSeatsLimit,
            newActiveFlowsLimit,
            newPlan,
            newProjectsLimit,
            newUserSeatsLimit,
        } = params

        const currentTier = PLAN_HIERARCHY[currentPlan]
        const newTier = PLAN_HIERARCHY[newPlan]

        if (newTier > currentTier) {
            return true
        }

        if (newTier < currentTier) {
            return false
        }

        const isAddonUpgrade =
            (!isNil(newActiveFlowsLimit) && newActiveFlowsLimit > currentActiveFlowsLimit) ||
            (!isNil(newProjectsLimit) && newProjectsLimit > currentProjectsLimit) ||
            (!isNil(newUserSeatsLimit) && newUserSeatsLimit > currentUserSeatsLimit)

        return isAddonUpgrade
    },
    checkIsTrialSubscription: (subscription: Stripe.Subscription): boolean => {
        return isNil(subscription.metadata['trialSubscription']) ? false : subscription.metadata['trialSubscription'] === 'true'
    },
    getPlanFromSubscription: (subscription: Stripe.Subscription): PlanName => {
        const isDev = stripeSecretKey?.startsWith('sk_test')
        const env = isDev ? 'dev' : 'prod'

        if (subscription.status === ApSubscriptionStatus.TRIALING) {
            return PlanName.PLUS
        }

        if (subscription.status !== ApSubscriptionStatus.ACTIVE) {
            return PlanName.FREE
        }

        const priceId = subscription.items.data[0].price.id
        switch (priceId) {
            case PRICE_ID_MAP[PRICE_NAMES.PLUS_PLAN][BillingCycle.ANNUAL][env]:
            case PRICE_ID_MAP[PRICE_NAMES.PLUS_PLAN][BillingCycle.MONTHLY][env]:
                return PlanName.PLUS
            case PRICE_ID_MAP[PRICE_NAMES.BUSINESS_PLAN][BillingCycle.ANNUAL][env]:
            case PRICE_ID_MAP[PRICE_NAMES.BUSINESS_PLAN][BillingCycle.MONTHLY][env]:
                return PlanName.BUSINESS
            default:
                return PlanName.FREE
        }
    },
    getPriceIdFor: (price: PRICE_NAMES): Record<BillingCycle, string> => {
        const isDev = stripeSecretKey?.startsWith('sk_test')
        const env = isDev ? 'dev' : 'prod'

        const entry = PRICE_ID_MAP[price]

        if (!entry) {
            throw new Error(`No price with the given price name '${price}' is available`)
        }

        return {
            [BillingCycle.MONTHLY]: entry[BillingCycle.MONTHLY][env],
            [BillingCycle.ANNUAL]: entry[BillingCycle.ANNUAL][env]
        }
    }
}

async function handleProjects(projectIds: string[], currentUsage: number, newLimit?: number | null): Promise<void> {
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
    newLimit?: number | null, 
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
    newLimit?: number | null,
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

type CheckLegitSubscriptionUpdateOrThrowParams = {
    newPlan: PlanName
    projectsAddon?: number
    userSeatsAddon?: number
}

type IsUpgradeEperienceParams = {
    currentPlan: PlanName 
    newPlan: PlanName
    newUserSeatsLimit?: number
    newProjectsLimit?: number
    newActiveFlowsLimit?: number
    currentUserSeatsLimit: number
    currentProjectsLimit: number
    currentActiveFlowsLimit: number
}