import dayjs from 'dayjs'
import { FlowRunHooks } from '../../flows/flow-run/flow-run-hooks'
import { projectUsageService } from '../../project/usage/project-usage-service'
import { emailService } from '../helper/email/email-service'
import { projectLimitsService } from '../project-plan/project-plan.service'
import { system } from '@activepieces/server-shared'
import { ApEdition } from '@activepieces/shared'

export const platformRunHooks: FlowRunHooks = {
    async onFinish({
        projectId,
        tasks,
    }: {
        projectId: string
        tasks: number
    }): Promise<void> {
        const edition = system.getEdition()
        if ([ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            const consumedTasks = await projectUsageService.increaseTasks(
                projectId,
                tasks,
            )
            await sendAlertsIfNeeded({
                projectId,
                consumedTasks,
                createdAt: dayjs().toISOString(),
                previousConsumedTasks: consumedTasks - tasks,
            })
        }
    },
}


async function sendAlertsIfNeeded({
    projectId,
    createdAt,
    consumedTasks,
    previousConsumedTasks,
}: {
    projectId: string
    createdAt: string
    consumedTasks: number
    previousConsumedTasks: number
}): Promise<void> {
    const quotaAlerts: { limit: number, templateName: 'quota-50' | 'quota-90' | 'quota-100' }[] = [
        { limit: 1.0, templateName: 'quota-100' },
        { limit: 0.9, templateName: 'quota-90' },
        { limit: 0.5, templateName: 'quota-50' },
    ]
    const projectPlan = await projectLimitsService.getPlanByProjectId(projectId)
    const tasksPerMonth = projectPlan?.tasks
    if (!tasksPerMonth) {
        return
    }
    const resetDate = projectUsageService.getCurrentingEndPeriod(createdAt).replace(' UTC', '')
    const currentUsagePercentage = (consumedTasks / tasksPerMonth) * 100
    const previousUsagePercentage = (previousConsumedTasks / tasksPerMonth) * 100

    for (const { limit, templateName } of quotaAlerts) {
        const projectPlanPercentage = tasksPerMonth * limit
        if (currentUsagePercentage >= projectPlanPercentage && previousUsagePercentage < projectPlanPercentage) {
            await emailService.sendQuotaAlert({
                templateName,
                projectId,
                resetDate: dayjs(resetDate).tz('America/Los_Angeles').format('DD MMM YYYY, HH:mm [PT]'),
            })
        }
    }
}