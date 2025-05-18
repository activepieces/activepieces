import { ApEdition, FlowRun, getCurrentBillingPeriodEnd, isFailedState, isFlowUserTerminalState, isNil, RunEnvironment, UsageMetric } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { FlowRunHooks } from '../../flows/flow-run/flow-run-hooks'
import { issuesService } from '../../flows/issues/issues-service'
import { system } from '../../helper/system/system'
import { projectService } from '../../project/project-service'
import { alertsService } from '../alerts/alerts-service'
import { emailService } from '../helper/email/email-service'
import { platformUsageService } from '../platform-billing/usage/usage-service'
import { projectLimitsService } from '../project-plan/project-plan.service'
import { projectUsageService } from '../projects/project-usage-service'

export const platformRunHooks = (log: FastifyBaseLogger): FlowRunHooks => ({
    async onFinish(flowRun: FlowRun): Promise<void> {
        const edition = system.getEdition()
        if (![ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(edition)) {
            return
        }
        if (!isFlowUserTerminalState(flowRun.status)) {
            return
        }
        if (isFailedState(flowRun.status) && flowRun.environment === RunEnvironment.PRODUCTION) {
            const issue = await issuesService(log).add({
                flowId: flowRun.flowId,
                projectId: flowRun.projectId,
                flowRunCreatedAt: flowRun.created,
            })
            await alertsService(log).sendAlertOnRunFinish({ issue, flowRunId: flowRun.id })
        }
        if (isNil(flowRun.tasks)) {
            return
        }
        const consumedProjectUsage = await projectUsageService(log).increaseProjectUsage(flowRun.projectId, flowRun.tasks, UsageMetric.TASKS)

        const platformId = await projectService.getPlatformId(flowRun.projectId)
        await platformUsageService.increasePlatformUsage(platformId, flowRun.tasks, UsageMetric.TASKS)

        await sendQuotaAlertIfNeeded({
            projectId: flowRun.projectId,
            consumedTasks: consumedProjectUsage,
            createdAt: dayjs().toISOString(),
            previousConsumedTasks: consumedProjectUsage - flowRun.tasks,
            log,
        })
    },
})

async function sendQuotaAlertIfNeeded({ projectId, consumedTasks, previousConsumedTasks, log }: SendQuotaAlertIfNeededParams): Promise<void> {
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
    const resetDate = getCurrentBillingPeriodEnd().replace(' UTC', '')
    const currentUsagePercentage = (consumedTasks / tasksPerMonth) * 100
    const previousUsagePercentage = (previousConsumedTasks / tasksPerMonth) * 100

    for (const { limit, templateName } of quotaAlerts) {
        const projectPlanPercentage = tasksPerMonth * limit
        if (currentUsagePercentage >= projectPlanPercentage && previousUsagePercentage < projectPlanPercentage) {
            await emailService(log).sendQuotaAlert({
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
    log: FastifyBaseLogger
}
