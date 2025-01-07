import { ApEdition, ApEnvironment, PlatformUsage, ProjectUsage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { system } from '../../../helper/system/system'
import { AppSystemProp } from '../../../helper/system/system-prop'
import { getRedisConnection } from '../../../database/redis-connection'
import { apDayjs } from '../../../helper/dayjs-helper'
import { projectService } from '../../../project/project-service'
import { projectMemberService } from '../../project-members/project-member.service'
import { userInvitationsService } from '../../../user-invitations/user-invitation.service'
import { projectLimitsService } from '../../../ee/project-plan/project-plan.service'
import { exceptionHandler } from '@activepieces/server-shared'
import { platformBillingService } from '../platform-billing.service'

export const USAGE_TYPES = {
    TASKS: 'tasks',
    AI_TOKENS: 'aiTokens',
} as const;

export const ENTITY_TYPES = {
    PROJECT: 'project',
    PLATFORM: 'platform',
} as const;

type UsageType = typeof USAGE_TYPES[keyof typeof USAGE_TYPES];
type UsageEntityType = typeof ENTITY_TYPES[keyof typeof ENTITY_TYPES];

const environment = system.get(AppSystemProp.ENVIRONMENT)
const edition = system.getEdition()

const redisKeyGenerator = (entityId: string, entityType: UsageEntityType, startBillingPeriod: string, usageType: UsageType): string => {
    return `${entityType}-${entityId}-usage-${usageType}:${startBillingPeriod}`;
};

export const usageService = (log: FastifyBaseLogger) => ({
    async getUsageForBillingPeriod(entityId: string, entityType: UsageEntityType): Promise<ProjectUsage> {
        const startBillingPeriod = getCurrentBillingPeriodStart();
        const tasks = await getUsage(entityId, entityType, startBillingPeriod, USAGE_TYPES.TASKS);
        const aiTokens = await getUsage(entityId, entityType, startBillingPeriod, USAGE_TYPES.AI_TOKENS);
        const teamMembers = entityType === ENTITY_TYPES.PROJECT ? 
            await projectMemberService(log).countTeamMembers(entityId) + 
            await userInvitationsService(log).countByProjectId(entityId) : 
            0;

        return { tasks, aiTokens, teamMembers };
    },

    async aiTokensExceededLimit(projectId: string, tokensToConsume: number): Promise<boolean> {
        if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            return false;
        }

        try {
            const projectPlan = await projectLimitsService.getPlanByProjectId(projectId);
            if (!projectPlan) {
                return false;
            }
            const platformId = await projectService.getPlatformId(projectId)
            const platformBilling = await platformBillingService(log).getOrCreateForPlatform(platformId)
            const consumedProjectTokens = await increaseProjectAndPlatformUsage(projectId, tokensToConsume, USAGE_TYPES.AI_TOKENS)
            const consumedPlatformTokens = await increaseProjectAndPlatformUsage(platformId, tokensToConsume, USAGE_TYPES.AI_TOKENS)
            return consumedProjectTokens >= projectPlan.aiTokens || consumedPlatformTokens >= platformBilling.aiCreditsLimit
        }
        catch(e) {
            exceptionHandler.handle(e, log);
            throw e;
        }
    },

    async tasksExceededLimit(projectId: string): Promise<boolean> {
        if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            return false
        }

        try {
            const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
            if (!projectPlan) {
                return false
            }

            const platformId = await projectService.getPlatformId(projectId)
            const platformBilling = await platformBillingService(log).getOrCreateForPlatform(platformId)
            const consumedProjectTasks = await increaseProjectAndPlatformUsage(projectId, 0, USAGE_TYPES.TASKS)
            const consumedPlatformTasks = await increaseProjectAndPlatformUsage(platformId, 0, USAGE_TYPES.TASKS)
            return consumedProjectTasks >= projectPlan.tasks || consumedPlatformTasks >= platformBilling.tasksLimit
        }
        catch (e) {
            exceptionHandler.handle(e, log)
            return false
        }
    },
    increaseProjectAndPlatformUsage,
    getCurrentBillingPeriodStart,
    getCurrentBillingPeriodEnd,
    getUsage
});

async function increaseProjectAndPlatformUsage(projectId: string, incrementBy: number, usageType: UsageType): Promise<number> {
    const edition = system.getEdition()
    if (edition === ApEdition.COMMUNITY || environment === ApEnvironment.TESTING) {
        return 0
    }
    
    const redisConnection = getRedisConnection()
    const startBillingPeriod = getCurrentBillingPeriodStart()
    
    const projectRedisKey = redisKeyGenerator(projectId, ENTITY_TYPES.PROJECT, startBillingPeriod, usageType)
    const projectUsage = await redisConnection.incrby(projectRedisKey, incrementBy)

    const platformId = await projectService.getPlatformId(projectId)
    const platformRedisKey = redisKeyGenerator(platformId, ENTITY_TYPES.PLATFORM, startBillingPeriod, usageType)
    await redisConnection.incrby(platformRedisKey, incrementBy)

    return projectUsage
}

async function getUsage(entityId: string, entityType: UsageEntityType, startBillingPeriod: string, usageType: UsageType): Promise<number> {
    if (environment === ApEnvironment.TESTING) {
        return 0;
    }

    const redisKey = redisKeyGenerator(entityId, entityType, startBillingPeriod, usageType);
    const redisConnection = getRedisConnection();

    const value = await redisConnection.get(redisKey);
    return Number(value) || 0;
}

function getCurrentBillingPeriodStart(): string {
    return apDayjs().startOf('month').toISOString();
}

function getCurrentBillingPeriodEnd(): string {
    return apDayjs().endOf('month').toISOString();
}
