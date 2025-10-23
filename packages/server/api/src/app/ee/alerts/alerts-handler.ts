import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../database/redis-connections'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { domainHelper } from '../custom-domains/domain-helper'
import { emailService } from '../helper/email/email-service'
import { apDayjsDuration } from '@activepieces/server-shared'
import { MAX_ALERTS_PER_DAY } from '@activepieces/ee-shared'


const DAY_IN_SECONDS = apDayjsDuration(1, 'day').asSeconds()

export const alertEventKey = (projectId: string) => `flow_fail_count:${projectId}`

export async function handlerAlertTrigger(params: IssueParams, log: FastifyBaseLogger): Promise<void> {

    const redisConnection = await redisConnections.useExisting()
    const alertSentToday = await redisConnection.get(alertEventKey(params.projectId))

    await redisConnection.incr(alertEventKey(params.projectId)) // should be cleared also when job runs
    await redisConnection.expire(alertEventKey(params.projectId), DAY_IN_SECONDS)

    if (!alertSentToday || Number(alertSentToday) < MAX_ALERTS_PER_DAY) {
        await sendAlertOnFlowFailure(params, log)
        return
    }

    await scheduleSendingReminder(params, log)
}

async function sendAlertOnFlowFailure(params: IssueParams, log: FastifyBaseLogger): Promise<void> {
    const { platformId } = params

    const issueUrl = await domainHelper.getPublicUrl({
        platformId,
        path: 'runs?limit=10#Issues',
    })

    await emailService(log).sendIssueCreatedNotification({
        ...params,
        issueOrRunsPath: issueUrl,
        isIssue: true,
    })
}

async function scheduleSendingReminder(params: IssueParams, log: FastifyBaseLogger): Promise<void> {
    const endOfDay = dayjs().endOf('day')
    await systemJobsSchedule(log).upsertJob({
        job: {
            name: SystemJobName.ISSUES_REMINDER,
            data: {
                projectId: params.projectId,
                platformId: params.platformId,
                projectName: params.projectName,
            },
            jobId: `issues-reminder-${params.projectId}`,
        },
        schedule: {
            type: 'one-time',
            date: endOfDay,
        },
    })
}

export async function runScheduledReminderJob(data: SystemJobData<SystemJobName.ISSUES_REMINDER>, log: FastifyBaseLogger) {
    const redisConnection = await redisConnections.useExisting()
    const alertSentToday = await redisConnection.get(alertEventKey(data.projectId))

    if (alertSentToday && Number(alertSentToday) > MAX_ALERTS_PER_DAY) {
        await redisConnection.del(alertEventKey(data.projectId))
        await emailService(log).sendReminderJobHandler({
            projectId: data.projectId,
            projectName: data.projectName,
            platformId: data.platformId,
        })
    }
}

type IssueParams = {
    projectId: string
    projectName: string
    platformId: string
    flowId: string
    flowRunId: string
    flowName: string
    issueCount: number
    createdAt: string
}