import { ApSubscriptionStatus, BILLING_CYCLE_HIERARCHY, BillingCycle, METRIC_TO_LIMIT_MAPPING, METRIC_TO_USAGE_MAPPING, PLAN_HIERARCHY, PlanName, PRICE_ID_MAP, PRICE_NAMES, RESOURCE_TO_MESSAGE_MAPPING } from '@activepieces/ee-shared'
import { AppSystemProp } from '@activepieces/server-shared'
import { ActivepiecesError, ApEdition, ErrorCode, FlowStatus, isNil, PlatformPlanLimits, PlatformRole, PlatformUsageMetric, UserStatus } from '@activepieces/shared'
import Stripe from 'stripe'
import { flowService } from '../../../flows/flow/flow.service'
import { system } from '../../../helper/system/system'
import { projectService } from '../../../project/project-service'
import { userService } from '../../../user/user-service'
import { projectLimitsService } from '../../projects/project-plan/project-plan.service'
import { platformUsageService } from '../platform-usage-service'
import { platformPlanService } from './platform-plan.service'

const edition = system.getEdition()
const stripeSecretKey = system.get(AppSystemProp.STRIPE_SECRET_KEY)

export const PLUS_PLAN_PRICE_ID = getPriceIdFor(PRICE_NAMES.PLUS_PLAN)
export const BUSINESS_PLAN_PRICE_ID = getPriceIdFor(PRICE_NAMES.BUSINESS_PLAN)
export const AI_CREDIT_PRICE_ID = getPriceIdFor(PRICE_NAMES.AI_CREDITS)
export const ACTIVE_FLOW_PRICE_ID = getPriceIdFor(PRICE_NAMES.ACTIVE_FLOWS)
export const PROJECT_PRICE_ID = getPriceIdFor(PRICE_NAMES.PROJECT)
export const USER_SEAT_PRICE_ID = getPriceIdFor(PRICE_NAMES.USER_SEAT)

export const AI_CREDIT_PRICE_IDS = [
    AI_CREDIT_PRICE_ID[BillingCycle.ANNUAL],
    AI_CREDIT_PRICE_ID[BillingCycle.MONTHLY],
]

export const PLUS_PLAN_PRICE_IDS = [
    PLUS_PLAN_PRICE_ID[BillingCycle.ANNUAL],
    PLUS_PLAN_PRICE_ID[BillingCycle.MONTHLY],
]

export const BUSINESS_PLAN_PRICE_IDS = [
    BUSINESS_PLAN_PRICE_ID[BillingCycle.ANNUAL],
    BUSINESS_PLAN_PRICE_ID[BillingCycle.MONTHLY],
]

export const ACTIVE_FLOW_PRICE_IDS = [
    ACTIVE_FLOW_PRICE_ID[BillingCycle.ANNUAL],
    ACTIVE_FLOW_PRICE_ID[BillingCycle.MONTHLY],
]

export const USER_SEAT_PRICE_IDS = [
    USER_SEAT_PRICE_ID[BillingCycle.ANNUAL],
    USER_SEAT_PRICE_ID[BillingCycle.MONTHLY],
]

export const PROJECT_PRICE_IDS = [
    PROJECT_PRICE_ID[BillingCycle.ANNUAL],
    PROJECT_PRICE_ID[BillingCycle.MONTHLY],
]

export const PlatformPlanHelper = {
    checkQuotaOrThrow: async (params: QuotaCheckParams): Promise<void> => {
        const { platformId, projectId, metric } = params

        if (![ApEdition.ENTERPRISE, ApEdition.CLOUD].includes(edition)) {
            return
        }

        const plan = await platformPlanService(system.globalLogger()).getOrCreateForPlatform(platformId)

        if (plan.licenseKey && plan.licenseKey !== '' && edition === ApEdition.CLOUD) {
            return
        }
        if (!isNil(projectId)) {
            await projectLimitsService(system.globalLogger()).ensureProjectUnlockedAndGetPlatformPlan(projectId)
        }

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
        const requestUserSeatAddon = !isNil(userSeatsAddon) && userSeatsAddon > 0
        const requestProjectAddon = !isNil(projectsAddon) && projectsAddon > 0

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
            currentCycle,
            newCycle,
            currentProjectsLimit,
            currentUserSeatsLimit,
            newActiveFlowsLimit,
            newPlan,
            newProjectsLimit,
            newUserSeatsLimit,
        } = params

        const currentPlanTier = PLAN_HIERARCHY[currentPlan]
        const newPlanTier = PLAN_HIERARCHY[newPlan]
        const currentCycleTier = BILLING_CYCLE_HIERARCHY[currentCycle]
        const newCycleTier = BILLING_CYCLE_HIERARCHY[newCycle]

        if (newCycleTier > currentCycleTier) {
            return true
        }

        if (newCycleTier < currentCycleTier) {
            return false
        }

        if (newPlanTier > currentPlanTier) {
            return true
        }

        if (newPlanTier < currentPlanTier) {
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
    getPlanFromSubscription: (subscription: Stripe.Subscription): { plan: PlanName, cycle: BillingCycle } => {
        const isDev = stripeSecretKey?.startsWith('sk_test')
        const env = isDev ? 'dev' : 'prod'

        if (![ApSubscriptionStatus.ACTIVE, ApSubscriptionStatus.TRIALING].includes(subscription.status as ApSubscriptionStatus)) {
            return { plan: PlanName.FREE, cycle: BillingCycle.MONTHLY }
        }

        const priceId = subscription.items.data[0].price.id
        switch (priceId) {
            case PRICE_ID_MAP[PRICE_NAMES.PLUS_PLAN][BillingCycle.ANNUAL][env]:
                return { plan: PlanName.PLUS, cycle: BillingCycle.ANNUAL }
            case PRICE_ID_MAP[PRICE_NAMES.PLUS_PLAN][BillingCycle.MONTHLY][env]:
                return { plan: PlanName.PLUS, cycle: BillingCycle.MONTHLY }
            case PRICE_ID_MAP[PRICE_NAMES.BUSINESS_PLAN][BillingCycle.ANNUAL][env]:
                return { plan: PlanName.BUSINESS, cycle: BillingCycle.ANNUAL }
            case PRICE_ID_MAP[PRICE_NAMES.BUSINESS_PLAN][BillingCycle.MONTHLY][env]:
                return { plan: PlanName.BUSINESS, cycle: BillingCycle.MONTHLY }
            default:
                return { plan: PlanName.FREE, cycle: BillingCycle.MONTHLY }
        }
    },
    
}

function getPriceIdFor(price: PRICE_NAMES): Record<BillingCycle, string> {
    const isDev = stripeSecretKey?.startsWith('sk_test')
    const env = isDev ? 'dev' : 'prod'

    const entry = PRICE_ID_MAP[price]

    if (!entry) {
        throw new Error(`No price with the given price name '${price}' is available`)
    }

    return {
        [BillingCycle.MONTHLY]: entry[BillingCycle.MONTHLY][env],
        [BillingCycle.ANNUAL]: entry[BillingCycle.ANNUAL][env],
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

    const activeUserUnfiltered = await Promise.all(projectIds.map(id => {
        return userService.listProjectUsers({
            projectId: id, 
            platformId,
        })
    }))

    const activeUsers = activeUserUnfiltered.flatMap(user => user).filter(user => user.platformRole !== PlatformRole.ADMIN)
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
    currentCycle: BillingCycle
    newCycle: BillingCycle
    newUserSeatsLimit?: number
    newProjectsLimit?: number
    newActiveFlowsLimit?: number
    currentUserSeatsLimit: number
    currentProjectsLimit: number
    currentActiveFlowsLimit: number
}