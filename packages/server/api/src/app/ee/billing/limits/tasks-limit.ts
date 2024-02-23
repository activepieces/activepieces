import {
    ActivepiecesError,
    ApEdition,
    ErrorCode,
    ProjectId,
    isNil,
} from '@activepieces/shared'

import { ProjectPlan } from '@activepieces/ee-shared'
import { apDayjs } from '../../../helper/dayjs-helper'
import { flowRunService } from '../../../flows/flow-run/flow-run-service'
import { getEdition } from '../../../helper/secret-helper'
import { plansService } from '../project-plan/project-plan.service'
import { exceptionHandler } from 'server-shared'
import { projectUsageService } from '../project-usage/project-usage-service'
import dayjs from 'dayjs'

async function limitTasksPerDay({
    projectId,
    tasksPerDay,
}: {
    projectId: ProjectId
    tasksPerDay: number
}): Promise<void> {
    const flowRunsInLastTwentyFourHours = await getTaskUserInUTCDay({
        projectId,
    })
    if (flowRunsInLastTwentyFourHours > tasksPerDay) {
        throw new ActivepiecesError({
            code: ErrorCode.QUOTA_EXCEEDED,
            params: {
                metric: 'tasks',
                quota: tasksPerDay,
            },
        })
    }
}

async function limitTasksPerMonth({
    projectPlan,
    consumedTasks,
}: {
    projectPlan: ProjectPlan
    consumedTasks: number
}): Promise<void> {
    if (consumedTasks > projectPlan.tasks) {
        throw new ActivepiecesError({
            code: ErrorCode.QUOTA_EXCEEDED,
            params: {
                metric: 'tasks',
                quota: projectPlan.tasks,
            },
        })
    }
}

async function getTaskUserInUTCDay({
    projectId,
}: {
    projectId: ProjectId
}): Promise<number> {
    const now = apDayjs()
    const startOfDay = now.startOf('day').utc()

    return flowRunService.getTasksUsedAfter({
        projectId,
        created: startOfDay.toISOString(),
    })
}

async function limit({ projectId }: { projectId: ProjectId }): Promise<void> {
    const edition = getEdition()

    if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
        return
    }

    try {
        const projectPlan = await plansService.getOrCreateDefaultPlan({
            projectId,
        })

        if (!isNil(projectPlan.tasksPerDay)) {
            await limitTasksPerDay({
                projectId,
                tasksPerDay: projectPlan.tasksPerDay,
            })
        }

        const projectUsage = await projectUsageService.getUsageByProjectId(
            projectId,
        )
        const consumedTasks = await flowRunService.getTasksUsedAfter({
            projectId,
            created: dayjs(projectUsage.nextResetDatetime).subtract(30, 'days').toISOString(),
        })
        await limitTasksPerMonth({
            consumedTasks,
            projectPlan,
        })
    }
    catch (e) {
        if (
            e instanceof ActivepiecesError &&
            e.error.code === ErrorCode.QUOTA_EXCEEDED
        ) {
            throw e
        }
        else {
            // Ignore quota errors for sake of user experience and log them instead
            exceptionHandler.handle(e)
        }
    }
}

export const tasksLimit = {
    limit,
    getTaskUserInUTCDay,
}
