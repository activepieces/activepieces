import { system } from '@activepieces/server-shared'
import { ApEdition, isFailedState, isFlowUserTerminalState, isNil, RunEnvironment } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FlowRunHooks } from '../../flows/flow-run/flow-run-hooks'
import { projectUsageService } from '../../project/usage/project-usage-service'
import { alertsService } from '../alerts/alerts-service'
import { emailService } from '../helper/email/email-service'
import { issuesService } from '../issues/issues-service'
import { projectLimitsService } from '../project-plan/project-plan.service'

export const platformRunHooks: FlowRunHooks = {
    async onFinish(flowRun): Promise<void> {
        const edition = system.getEdition()
        if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            return
        }
        if (!isFlowUserTerminalState(flowRun.status)) {
            return
        }
        if (isFailedState(flowRun.status) && flowRun.environment === RunEnvironment.PRODUCTION) {
            const issue = await issuesService.add({
                flowId: flowRun.flowId,
                projectId: flowRun.projectId,
                flowRunCreatedAt: flowRun.created,
            })
            await alertsService.sendAlertOnRunFinish({ issue, flowRunId: flowRun.id })
        }
        if (isNil(flowRun.tasks)) {
            return
        }
        const consumedTasks = await projectUsageService.increaseUsage(flowRun.projectId, flowRun.tasks, 'tasks')
        await sendQuotaAlertIfNeeded({
            projectId: flowRun.projectId,
            consumedTasks,
            createdAt: dayjs().toISOString(),
            previousConsumedTasks: consumedTasks - flowRun.tasks,
        })
    },
}

async function sendQuotaAlertIfNeeded({ projectId, createdAt, consumedTasks, previousConsumedTasks }: SendQuotaAlertIfNeededParams): Promise<void> {
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

type SendQuotaAlertIfNeededParams = {
    projectId: string
    createdAt: string
    consumedTasks: number
    previousConsumedTasks: number
}