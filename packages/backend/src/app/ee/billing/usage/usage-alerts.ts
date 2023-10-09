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
import { system } from '../../../helper/system/system'
import { SystemProp } from '../../../helper/system/system-prop'
import sendgrid from '@sendgrid/mail'

dayjs.extend(utc)
dayjs.extend(timezone)

const alertingEmails = [
    {
        templateId: 'd-ff370bf352d940308714afdb37ea4b38',
        threshold: 50,
        sendForDailyLimit: false,
    },
    {
        threshold: 90,
        templateId: 'd-2159eff164df4f7fac246f04420858a2',
        sendForDailyLimit: true,
    },
    {
        threshold: 100,
        templateId: 'd-17ad40ee5ae34fc0914b8ce2648a393e',
        sendForDailyLimit: false,
    },
]

const sendgridKey = system.get(SystemProp.SENDGRID_KEY)
if (sendgridKey) {
    sendgrid.setApiKey(sendgridKey)
}

function calculateThreshold(consumedTask: number, planTasks: number) {
    return Math.floor((consumedTask / planTasks) * 100)
}

async function sendEmail(user: UserMeta, thresholdEmail: {
    threshold: number
    templateId: string
    sendForDailyLimit: boolean
}, projectUsage: ProjectUsage) {
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

    sendgrid.send({
        to: user.email,
        from: {
            email: 'notifications@activepieces.com',
            name: 'Activepieces',
        },
        templateId: thresholdEmail.templateId,
        dynamicTemplateData: {
            plans_link: 'https://cloud.activepieces.com/plans',
            first_name: user.firstName,
            reset_date: formattedDate,
        },
    }).catch((e) => logger.error(e, '[usageService#handleAlerts] sendgrid.send'))
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
}) {
    const consumedTask = !isNil(projectPlan.tasksPerDay) ?
        projectUsage.consumedTasksToday :
        projectUsage.consumedTasks

    const planTasks = !isNil(projectPlan.tasksPerDay) ?
        projectPlan.tasksPerDay :
        projectPlan.tasks

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