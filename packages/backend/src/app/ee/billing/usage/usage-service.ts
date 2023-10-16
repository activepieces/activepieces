import {
    ProjectId,
    apId,
} from '@activepieces/shared'
import { ProjectUsage } from '@activepieces/ee-shared'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

import { isNil } from 'lodash'
import { logger } from '../../../helper/logger'
import { usageAlerts } from './usage-alerts'
import { plansService } from '../plans/plan.service'
import { ProjectUsageEntity } from './usage-entity'
import { databaseConnection } from '../../../database/database-connection'
import { tasksLimit } from './limits/tasks-limit'
import { projectMemberService } from '../../../ee/project-members/project-member.service'
import { appConnectionService } from '../../../app-connection/app-connection-service/app-connection-service'


dayjs.extend(utc)
dayjs.extend(timezone)
const projectUsageRepo = databaseConnection.getRepository(ProjectUsageEntity)

export const usageService = {
    async addTasksConsumed(request: {
        projectId: ProjectId
        tasks: number
    }): Promise<void> {
        const projectUsage = await usageService.getUsage({
            projectId: request.projectId,
        })
        const projectPlan = await plansService.getOrCreateDefaultPlan({
            projectId: request.projectId,
        })
        usageAlerts.handleAlerts({
            projectUsage,
            projectPlan,
            numberOfTasks: request.tasks,
        }).catch((e) => logger.error(e, '[usageService#addTasksConsumed] handleAlerts'))
        await projectUsageRepo.increment(
            { id: projectUsage.id },
            'consumedTasks',
            request.tasks,
        )
    },
    async getUsage({
        projectId,
    }: {
        projectId: ProjectId
    }): Promise<ProjectUsage> {
        let projectUsage = await findLatestProjectUsage(projectId)
        const plan = await plansService.getOrCreateDefaultPlan({ projectId })
        const nextReset = nextResetDatetime(plan.subscriptionStartDatetime)
        if (
            isNil(projectUsage) ||
            isNotSame(nextReset, projectUsage.nextResetDatetime)
        ) {
            projectUsage = await projectUsageRepo.save({
                id: apId(),
                projectId,
                consumedTasks: 0,
                activeFlows: 0,
                teamMembers: 0,
                connections: 0,
                nextResetDatetime: nextReset,
            })
        }
        return {
            consumedTasksToday: await tasksLimit.getTaskUserInUTCDay({ projectId }),
            activeFlows: 0,
            teamMembers: await projectMemberService.countTeamMembersIncludingOwner(
                projectId,
            ),
            connections: await appConnectionService.countByProject({ projectId }),
            ...projectUsage,
        }
    },
}

async function findLatestProjectUsage(projectId: ProjectId) {
    return projectUsageRepo.findOne({
        where: {
            projectId,
        },
        order: {
            nextResetDatetime: 'DESC',
        },
    })
}

function isNotSame(firstDate: string, secondDate: string) {
    const fd = dayjs(firstDate)
    const sd = dayjs(secondDate)
    return !fd.isSame(sd)
}

function nextResetDatetime(datetime: string): string {
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
    const date = dayjs(datetime)
    const currentDate = dayjs()
    const nextResetInMs =
        thirtyDaysInMs - (currentDate.diff(date, 'millisecond') % thirtyDaysInMs)
    return currentDate.add(nextResetInMs, 'millisecond').toISOString()
}

