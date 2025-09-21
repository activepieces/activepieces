import { NotificationStatus } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { redisConnections } from '../../database/redis'
import { SystemJobName } from '../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { domainHelper } from '../custom-domains/domain-helper'
import { emailService } from '../helper/email/email-service'

const HOUR_IN_SECONDS = 3600
const DAY_IN_SECONDS = 86400
const HOURLY_LIMIT = 5
const DAILY_LIMIT = 15

export const alertsHandler = (log: FastifyBaseLogger) => ({
    [NotificationStatus.NEVER]: async (_: IssueParams): Promise<void> => Promise.resolve(),
    [NotificationStatus.ALWAYS]: async (params: IssueParams): Promise<void> => sendAlertOnFlowRun(params, log),
    [NotificationStatus.NEW_ISSUE]: async (params: IssueParams): Promise<void> => sendAlertOnNewIssue(params, log),
})

async function scheduleSendingReminder(params: IssueRemindersParams, log: FastifyBaseLogger): Promise<void> {
    const { projectId } = params
    if (params.issueCount === 1) {
        const project = await projectService.getOneOrThrow(projectId)
        const platform = await platformService.getOneOrThrow(project.platformId)
        const reminderKey = `reminder:${projectId}`
        const redisConnection = await redisConnections.useExisting()
        const isEmailScheduled = await redisConnection.get(reminderKey)
        if (isEmailScheduled) {
            return
        }

        const endOfDay = dayjs().endOf('day')
        await redisConnection.set(reminderKey, 0, 'EXAT', endOfDay.unix())
        
        await systemJobsSchedule(log).upsertJob({
            job: {
                name: SystemJobName.ISSUES_REMINDER,
                data: {
                    projectId,
                    platformId: platform.id,
                    projectName: project.displayName,
                },
                jobId: `issues-reminder-${projectId}`,
            },
            schedule: {
                type: 'one-time',
                date: endOfDay,
            },
        })
    }
}

async function sendAlertOnNewIssue(params: IssueParams, log: FastifyBaseLogger): Promise<void> {
    const { platformId, issueCount } = params

    const isOldIssue = issueCount > 1
    if (isOldIssue) {
        return
    }

    const issueUrl = await domainHelper.getPublicUrl({
        platformId,
        path: 'runs?limit=10#Issues',
    })

    await scheduleSendingReminder({ projectId: params.projectId, issueCount: params.issueCount }, log)
    await emailService(log).sendIssueCreatedNotification({
        ...params,
        issueOrRunsPath: issueUrl,
        isIssue: true,
    })
}

async function sendAlertOnFlowRun(params: IssueParams, log: FastifyBaseLogger): Promise<void> {
    const { flowId, platformId, flowRunId } = params
    const hourlyFlowIdKey = `alerts:hourly:${flowId}`
    const dailyFlowIdKey = `alerts:daily:${flowId}`

    const [hourlyCount, dailyCount] = await Promise.all([
        incrementAndExpire(hourlyFlowIdKey, HOUR_IN_SECONDS),
        incrementAndExpire(dailyFlowIdKey, DAY_IN_SECONDS),
    ])

    if (hourlyCount > HOURLY_LIMIT || dailyCount > DAILY_LIMIT) {
        return
    }

    const flowRunsUrl = await domainHelper.getInternalUrl({
        platformId,
        path: `runs/${flowRunId}`,
    })

    await scheduleSendingReminder({ projectId: params.projectId, issueCount: params.issueCount }, log)
    await emailService(log).sendIssueCreatedNotification({
        ...params,
        issueOrRunsPath: flowRunsUrl,
        isIssue: false,
    })
}

async function incrementAndExpire(key: string, expiryTime: number): Promise<number> {
    const redis = await redisConnections.useExisting()
    const count = await redis.incr(key)
    if (count === 1) {
        await redis.expire(key, expiryTime)
    }
    return count
}

type IssueParams = {
    projectId: string
    platformId: string
    flowId: string
    flowRunId: string
    flowName: string
    issueCount: number
    createdAt: string
}

type IssueRemindersParams = Pick<IssueParams, 'projectId' | 'issueCount'>