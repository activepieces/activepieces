import { ApEdition, FlowRun, isFlowUserTerminalState, isNil } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { emailService } from '../../ee/helper/email/email-service'
import { platformPlanService } from '../../ee/platform/platform-plan/platform-plan.service'
import { platformUsageService } from '../../ee/platform/platform-usage-service'
import { system } from '../../helper/system/system'
import { projectService } from '../../project/project-service'

const paidEditions = [ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(system.getEdition())
export const flowRunHooks = (log: FastifyBaseLogger) => ({
    async onFinish(flowRun: FlowRun): Promise<void> {
        if (!isFlowUserTerminalState(flowRun.status)) {
            return
        }
        if (isNil(flowRun.tasks) || !paidEditions) {
            return
        }
        const { projectTasksUsage } = await platformUsageService(log).increaseTasksUsage(flowRun.projectId, flowRun.tasks)
        await sendQuotaAlertIfNeeded({
            projectId: flowRun.projectId,
            consumedTasks: projectTasksUsage,
            createdAt: dayjs().toISOString(),
            previousConsumedTasks: projectTasksUsage - flowRun.tasks,
            log,
        })
    },
})

async function sendQuotaAlertIfNeeded({ projectId, consumedTasks, previousConsumedTasks, log }: SendQuotaAlertIfNeededParams): Promise<void> {
    const edition = system.getEdition()
    if (edition !== ApEdition.CLOUD) {
        return
    }
    const quotaAlerts: { limit: number, templateName: 'quota-50' | 'quota-90' | 'quota-100' }[] = [
        { limit: 1.0, templateName: 'quota-100' },
        { limit: 0.9, templateName: 'quota-90' },
        { limit: 0.5, templateName: 'quota-50' },
    ]
    const platformId = await projectService.getPlatformId(projectId)
    const platformBilling = await platformPlanService(log).getOrCreateForPlatform(platformId)
    const tasksPerMonth = platformBilling?.tasksLimit
    if (!tasksPerMonth) {
        return
    }

    const { startDate } = await platformPlanService(system.globalLogger()).getBillingDates(platformBilling)
    const currentUsagePercentage = (consumedTasks / tasksPerMonth) * 100
    const previousUsagePercentage = (previousConsumedTasks / tasksPerMonth) * 100

    for (const { limit, templateName } of quotaAlerts) {
        const projectPlanPercentage = tasksPerMonth * limit
        if (currentUsagePercentage >= projectPlanPercentage && previousUsagePercentage < projectPlanPercentage) {
            await emailService(log).sendQuotaAlert({
                templateName,
                projectId,
                resetDate: dayjs.unix(startDate).tz('America/Los_Angeles').format('DD MMM YYYY, HH:mm [PT]'),
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