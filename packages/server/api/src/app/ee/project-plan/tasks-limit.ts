import {
    ActivepiecesError,
    ApEdition,
    ErrorCode,
    ProjectId,
    ProjectPlan,
} from '@activepieces/shared'

import { projectLimitsService } from './project-plan.service'
import { exceptionHandler } from 'server-shared'
import dayjs from 'dayjs'
import { apDayjs } from '../../helper/dayjs-helper'
import { flowRunService } from '../../flows/flow-run/flow-run-service'
import { getEdition } from '../../helper/secret-helper'

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

async function limit({ projectId }: { projectId: ProjectId }): Promise<void> {
    const edition = getEdition()

    if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
        return
    }

    try {
        const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
        if (!projectPlan) {
            return
        }
        const consumedTasks = await flowRunService.getTasksUsedAfter({
            projectId,
            created: dayjs(nextResetDatetime(projectPlan.created)).subtract(30, 'days').toISOString(),
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
}

function nextResetDatetime(datetime: string): string {
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
    const date = apDayjs(datetime)
    const currentDate = apDayjs()
    const nextResetInMs =
        thirtyDaysInMs - (currentDate.diff(date, 'millisecond') % thirtyDaysInMs)
    return currentDate.add(nextResetInMs, 'millisecond').toISOString()
}
