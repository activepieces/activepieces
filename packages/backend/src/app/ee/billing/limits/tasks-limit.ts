import { ActivepiecesError, ApEdition, ErrorCode, ProjectId, isNil } from '@activepieces/shared'

import { ProjectPlan, ProjectUsage } from '@activepieces/shared'
import { apDayjs } from '../../../helper/dayjs-helper'
import { flowRunService } from '../../../flows/flow-run/flow-run-service'
import { getEdition } from '../../../helper/secret-helper'
import { plansService } from '../project-plan/project-plan.service'
import { projectUsageService } from '../project-usage/project-usage-service'
import { captureException } from '../../../helper/logger'


async function limitTasksPerDay({
    projectId,
    tasksPerDay,
}: { projectId: ProjectId, tasksPerDay: number }): Promise<void> {
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
    projectUsage,
}: { projectPlan: ProjectPlan, projectUsage: ProjectUsage }): Promise<void> {
    if (projectUsage.consumedTasks > projectPlan.tasks) {
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

    return flowRunService.getAllProdRuns({
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
        const projectUsage = await projectUsageService.getUsageByProjectId(projectId)
        await limitTasksPerMonth({
            projectUsage,
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
            captureException(e)
        }
    }
}

export const tasksLimit = {
    limit,
    getTaskUserInUTCDay,
}