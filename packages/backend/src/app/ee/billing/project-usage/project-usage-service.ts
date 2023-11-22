import {
    ProjectId,
    apId,
} from '@activepieces/shared'
import {  ProjectUsage } from '@activepieces/ee-shared'
import { isNil } from 'lodash'
import { logger } from '../../../helper/logger'
import { ProjectUsageEntity, ProjectUsageSchema } from './project-usage.entity'
import { databaseConnection } from '../../../database/database-connection'
import { projectMemberService } from '../../project-members/project-member.service'
import { appConnectionService } from '../../../app-connection/app-connection-service/app-connection-service'
import { plansService } from '../project-plan/project-plan.service'
import { tasksLimit } from '../limits/tasks-limit'
import { apDayjs } from '../../../helper/dayjs-helper'
import { usageAlerts } from './project-usage-alerts'

const projectUsageRepo = databaseConnection.getRepository(ProjectUsageEntity)

export const projectUsageService = {
    async addTasksConsumed(request: {
        projectId: ProjectId
        tasks: number
    }): Promise<void> {
        const projectUsage = await projectUsageService.getUsageByProjectId(request.projectId)
        usageAlerts.handleAlerts({
            projectUsage,
            numberOfTasks: request.tasks,
        }).catch((e) => logger.error(e, '[usageService#addTasksConsumed] handleAlerts'))
        await projectUsageRepo.increment(
            { id: projectUsage.id },
            'consumedTasks',
            request.tasks,
        )
    },


    async getUsageByProjectId(projectId: string): Promise<ProjectUsage> {
        let projectUsage = await projectUsageRepo.findOne({
            where: {
                projectId,
            },
            order: {
                nextResetDatetime: 'DESC',
            },
        })
        const plan = await plansService.getOrCreateDefaultPlan({ projectId })
        const nextReset = nextResetDatetime(plan.subscriptionStartDatetime)
        if (
            isNil(projectUsage) ||
            isNotSame(nextReset, projectUsage.nextResetDatetime)
        ) {
            projectUsage = await createNewUsage(projectId, nextReset)
        }
        return enrichProjectUsage(projectUsage)
    },
}

async function enrichProjectUsage(schema: ProjectUsageSchema): Promise<ProjectUsage> {
    const projectId = schema.projectId
    return {
        consumedTasksToday: await tasksLimit.getTaskUserInUTCDay({ projectId }),
        teamMembers: await projectMemberService.countTeamMembersIncludingOwner(
            projectId,
        ),
        connections: await appConnectionService.countByProject({ projectId }),
        ...schema,
    }
}

async function createNewUsage(projectId: string, nextReset: string): Promise<ProjectUsageSchema> {
    return projectUsageRepo.save({
        id: apId(),
        projectId,
        consumedTasks: 0,
        nextResetDatetime: nextReset,
    })
}

function isNotSame(firstDate: string, secondDate: string): boolean {
    const fd = apDayjs(firstDate)
    const sd = apDayjs(secondDate)
    return !fd.isSame(sd)
}

function nextResetDatetime(datetime: string): string {
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
    const date = apDayjs(datetime)
    const currentDate = apDayjs()
    const nextResetInMs =
        thirtyDaysInMs - (currentDate.diff(date, 'millisecond') % thirtyDaysInMs)
    return currentDate.add(nextResetInMs, 'millisecond').toISOString()
}

