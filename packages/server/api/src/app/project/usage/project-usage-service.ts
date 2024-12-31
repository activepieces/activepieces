import { ApEdition, ApEnvironment, ProjectUsage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { getRedisConnection } from '../../database/redis-connection'
import { projectMemberService } from '../../ee/project-members/project-member.service'
import { apDayjs } from '../../helper/dayjs-helper'
import { system } from '../../helper/system/system'
import { AppSystemProp } from '../../helper/system/system-prop'
import { userInvitationsService } from '../../user-invitations/user-invitation.service'
import { projectService } from '../project-service'

type UsageType = 'tasks' | 'aiTokens'

const environment = system.get(AppSystemProp.ENVIRONMENT)

const redisKeys: Record<UsageType, (projectId: string, startBillingPeriod: string) => string> = {
    'tasks': (projectId: string, startBillingPeriod: string) => `project-usage:${projectId}:${startBillingPeriod}`,
    'aiTokens': (projectId: string, startBillingPeriod: string) => `project-ai-tokens-usage:${projectId}:${startBillingPeriod}`,
}

export const projectUsageService = (log: FastifyBaseLogger) => ({
    async getUsageForBillingPeriod(projectId: string, startBillingPeriod: string): Promise<ProjectUsage> {
        const flowTasks = await getUsage(projectId, getCurrentingStartPeriod(startBillingPeriod), 'tasks')
        const teamMembers = await projectMemberService(log).countTeamMembers(projectId) + await userInvitationsService(log).countByProjectId(projectId)
        const aiTokens = await getUsage(projectId, getCurrentingStartPeriod(startBillingPeriod), 'aiTokens')
        return {
            tasks: flowTasks,
            teamMembers,
            aiTokens,
            nextLimitResetDate: getCurrentingEndPeriod(startBillingPeriod),
        }
    },
    increaseUsage,
    getCurrentingStartPeriod,
    getCurrentingEndPeriod,
    getUsage,
})

function getCurrentingStartPeriod(datetime: string): string {
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
    const date = apDayjs(datetime)
    const currentDate = apDayjs()
    const nextResetInMs = (currentDate.diff(date, 'millisecond') % thirtyDaysInMs)
    return currentDate.subtract(nextResetInMs, 'millisecond').toISOString()
}

function getCurrentingEndPeriod(datetime: string): string {
    return apDayjs(getCurrentingStartPeriod(datetime)).add(30, 'days').toISOString()
}

async function increaseUsage(projectId: string, incrementBy: number, usageType: UsageType): Promise<number> {
    const edition = system.getEdition()
    if (edition === ApEdition.COMMUNITY) {
        return 0
    }
    if (environment === ApEnvironment.TESTING) {
        return 0
    }
    const project = await projectService.getOneOrThrow(projectId)
    const startBillingPeriod = getCurrentingStartPeriod(project.created)
    const key = redisKeys[usageType](projectId, startBillingPeriod)
    return getRedisConnection().incrby(key, incrementBy)
}

async function getUsage(projectId: string, startBillingPeriod: string, usageType: UsageType): Promise<number> {
    if (environment === ApEnvironment.TESTING) {
        return 0
    }
    const key = redisKeys[usageType](projectId, startBillingPeriod)
    const value = await getRedisConnection().get(key)
    return Number(value) || 0
}
