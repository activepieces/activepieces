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

export enum BillingUsageType {
    TASKS = 'tasks',
    AI_TOKENS = 'aiTokens',
}

export enum BillingEntityType {
    PROJECT = 'project',
    PLATFORM = 'platform',
}

const environment = system.get(AppSystemProp.ENVIRONMENT)
const edition = system.getEdition()

const redisKeyGenerator = (entityId: string, entityType: BillingEntityType, startBillingPeriod: string, usageType: BillingUsageType): string => {
    return `${entityType}-${entityId}-usage-${usageType}:${startBillingPeriod}`;
};

export const usageService = (log: FastifyBaseLogger) => ({
    async getUsageForBillingPeriod(entityId: string, entityType: BillingEntityType): Promise<ProjectUsage> {
        const startBillingPeriod = getCurrentBillingPeriodStart();
        const tasks = await getUsage(entityId, entityType, startBillingPeriod, BillingUsageType.TASKS);
        const aiTokens = await getUsage(entityId, entityType, startBillingPeriod, BillingUsageType.AI_TOKENS);
        const teamMembers = entityType === BillingEntityType.PROJECT ? 
            await projectMemberService(log).countTeamMembers(entityId) + 
            await userInvitationsService(log).countByProjectId(entityId) : 
            0;

        return { 
            tasks, 
            aiTokens, 
            teamMembers,
            nextLimitResetDate: getCurrentBillingPeriodEnd()
        };
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
            const consumedProjectTokens = await increaseProjectAndPlatformUsage(projectId, tokensToConsume, BillingUsageType.AI_TOKENS)
            const consumedPlatformTokens = await increaseProjectAndPlatformUsage(platformId, tokensToConsume, BillingUsageType.AI_TOKENS)
            return consumedProjectTokens >= projectPlan.aiTokens || consumedPlatformTokens >= (platformBilling.aiCreditsLimit ?? 0)
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
            const consumedProjectTasks = await increaseProjectAndPlatformUsage(projectId, 0, BillingUsageType.TASKS)
            const consumedPlatformTasks = await increaseProjectAndPlatformUsage(platformId, 0, BillingUsageType.TASKS)
            return consumedProjectTasks >= projectPlan.tasks || consumedPlatformTasks >= (platformBilling.tasksLimit ?? 0)
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

async function increaseProjectAndPlatformUsage(projectId: string, incrementBy: number, usageType: BillingUsageType): Promise<number> {
    const edition = system.getEdition()
    if (edition === ApEdition.COMMUNITY || environment === ApEnvironment.TESTING) {
        return 0
    }
    
    const redisConnection = getRedisConnection()
    const startBillingPeriod = getCurrentBillingPeriodStart()
    
    const projectRedisKey = redisKeyGenerator(projectId, BillingEntityType.PROJECT, startBillingPeriod, usageType)
    const projectUsage = await redisConnection.incrby(projectRedisKey, incrementBy)

    const platformId = await projectService.getPlatformId(projectId)
    const platformRedisKey = redisKeyGenerator(platformId, BillingEntityType.PLATFORM, startBillingPeriod, usageType)
    await redisConnection.incrby(platformRedisKey, incrementBy)

    return projectUsage
}

async function getUsage(entityId: string, entityType: BillingEntityType, startBillingPeriod: string, usageType: BillingUsageType): Promise<number> {
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
