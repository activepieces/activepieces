import {
    FlowRunStatus,
    FlowRun,
    NotificationStatus,
    RunEnvironment,
    UserMeta,
} from '@activepieces/shared'
import { SystemProp, exceptionHandler, logger, system } from 'server-shared'
import axios from 'axios'
import { projectService } from '../project/project-service'
import { userService } from '../user/user-service'

const notificationUrl = system.get(SystemProp.NOTIFICATION_URL)

export const notifications = {
    async notifyRun({ flowRun }: NotifyFailureRunParams) {
        if (flowRun.environment === RunEnvironment.TESTING) {
            return
        }
        if (
            ![
                FlowRunStatus.FAILED,
                FlowRunStatus.INTERNAL_ERROR,
            ].includes(flowRun.status)
        ) {
            return
        }
        if (!notificationUrl) {
            return
        }
        const project = await projectService.getOne(flowRun.projectId)
        if (!project || project.notifyStatus === NotificationStatus.NEVER) {
            return
        }
        const user = await userService.getMetaInfo({ id: project.ownerId })
        await sendWebhook({
            type: NotificationEventEnum.RUN_FAILED,
            payload: {
                owner: user!,
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
        owner: UserMeta
        run: FlowRun
    }
}

enum NotificationEventEnum {
    RUN_FAILED = 'run.failed',
}

async function sendWebhook(payload: RunFailedWebhookPayload): Promise<void> {
    try {
        const response = await axios.post(notificationUrl!, payload, {
            headers: {
                'Content-Type': 'application/json',
            },
        })
        logger.info(
            `Webhook sent to ${notificationUrl} with status code ${response.status}`,
        )
    }
    catch (error) {
        exceptionHandler.handle(error)
    }
}
