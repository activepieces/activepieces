import {
    ProjectPlan,
    ProjectUsage,
} from '@activepieces/ee-shared'
import { isNil } from 'lodash'
import { telemetry } from '../../../helper/telemetry.utils'
import { TelemetryEventName, UserMeta } from '@activepieces/shared'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import { projectService } from '../../../project/project-service'
import { userService } from '../../../user/user-service'
import { logger } from '../../../helper/logger'
import { emailService } from '../../helper/email/email-service'

dayjs.extend(utc)
dayjs.extend(timezone)

const alertingEmails: {
    threshold: number
    templateId: 'quota-50' | 'quota-90' | 'quota-100'
    sendForDailyLimit: boolean
}[] = [
    {
        templateId: 'quota-50',
        threshold: 50,
        sendForDailyLimit: false,
    },
    {
        threshold: 90,
        templateId: 'quota-90',
        sendForDailyLimit: true,
    },
    {
        threshold: 100,
        templateId: 'quota-100',
        sendForDailyLimit: false,
    },
]

function calculateThreshold(consumedTask: number, planTasks: number): number {
    return Math.floor((consumedTask / planTasks) * 100)
}

async function sendEmail(user: UserMeta, thresholdEmail: {
    threshold: number
    templateId: 'quota-50' | 'quota-90' | 'quota-100'
    sendForDailyLimit: boolean
}, projectUsage: ProjectUsage): Promise<void> {
    const project = await projectService.getOne(projectUsage.projectId)
    if (!project) {
        throw new Error(`Project with ID ${projectUsage.projectId} not found`)
    }

    const resetDate = dayjs.utc(projectUsage.nextResetDatetime)
    const formattedDate = resetDate.utc().format('MM/DD/YYYY hh:mm:ss A')

    telemetry.trackProject(project.id, {
        name: TelemetryEventName.QUOTA_ALERT,
        payload: {
            percentageUsed: thresholdEmail.threshold,
        },
    }).catch((e) => logger.error(e, '[usageService#handleAlerts] telemetry.trackProject'))

    emailService.sendQuotaAlert({
        templateId: thresholdEmail.templateId,
        email: user.email,
        projectId: project.id,
        firstName: user.firstName,
        resetDate: formattedDate,
    }).catch((e) => logger.error(e, '[usageService#handleAlerts] emailService.send'))
}

// Function to handle alerts
async function handleAlerts({
    projectUsage,
    projectPlan,
    numberOfTasks,
}: {
    projectUsage: ProjectUsage
    projectPlan: ProjectPlan
    numberOfTasks: number
}): Promise<void> {
    const consumedTask = !isNil(projectPlan.tasksPerDay) ?
        projectUsage.consumedTasksToday :
        projectUsage.consumedTasks

    const planTasks = projectPlan.tasksPerDay ? projectPlan.tasksPerDay : projectPlan.tasks

    for (const emailTemplate of alertingEmails) {
        const threshold = calculateThreshold(consumedTask, planTasks)
        const newThreshold = calculateThreshold(consumedTask + numberOfTasks, planTasks)

        if (threshold < emailTemplate.threshold && newThreshold >= emailTemplate.threshold) {
            if (!emailTemplate.sendForDailyLimit && projectPlan.tasksPerDay) {
                continue
            }

            const project = await projectService.getOne(projectUsage.projectId)
            if (!project) {
                throw new Error(`Project with ID ${projectUsage.projectId} not found`)
            }
            const user = (await userService.getMetaInfo({ id: project.ownerId }))!
            logger.info({
                email: user.email,
                threshold: emailTemplate.threshold,
                consumedTask,
                planTasks,
                numberOfTasks,
                message: 'Sending email',
            })
            await sendEmail(user, emailTemplate, projectUsage)
        }
    }
}

export const usageAlerts = {
    handleAlerts,
}