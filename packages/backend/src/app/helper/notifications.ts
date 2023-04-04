import { ExecutionOutputStatus, FlowRun, RunEnvironment, UserMeta } from '@/shared/src'
import { logger } from './logger'
import { system } from './system/system'
import { SystemProp } from './system/system-prop'
import axios from 'axios'
import { captureException } from '@sentry/node'
import { projectService } from '../project/project.service'
import { userService } from '../user/user-service'

const notificationUrl = system.get(SystemProp.NOTIFICATION_URL)

export const notifications = {
    async notifyRun({ flowRun }: NotifyFailureRunParams) {
        if (flowRun.environment === RunEnvironment.TESTING) {
            return
        }
        if ([ExecutionOutputStatus.FAILED, ExecutionOutputStatus.INTERNAL_ERROR].indexOf(flowRun.status) === -1) {
            return
        }
        if (!notificationUrl) {
            return
        }
        const project = await projectService.getOne(flowRun.projectId)
        const user = await userService.getMetaInfo({ id: project.ownerId })
        await sendWebhook({
            type: NotificationEventEnum.RUN_FAILED,
            payload: {
                user: user,
                run: flowRun,
            },
        })
    },
}

type NotifyFailureRunParams = {
    flowRun: FlowRun
}

type RunFailedWebhookPayload = {
    type: NotificationEventEnum
    payload: {
        user: UserMeta
        run: FlowRun
    }
}

enum NotificationEventEnum {
    RUN_FAILED = 'run.failed',
}

async function sendWebhook(payload: RunFailedWebhookPayload): Promise<void> {
    try {
        const response = await axios.post(notificationUrl, payload, {
            headers: {
                'Content-Type': 'application/json',
            },
        })
        logger.info(`Webhook sent to ${notificationUrl} with status code ${response.status}`)
    }
    catch (error) {
        captureException(error)
        logger.error(`Error sending webhook: ${error}`)
    }
}