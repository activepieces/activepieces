import { getRedisConnection } from '../../database/redis-connection'
import { emailService } from '../helper/email/email-service'
import { platformDomainHelper } from '../helper/platform-domain-helper'
import { NotificationStatus } from '@activepieces/shared'

const HOUR_IN_SECONDS = 3600
const DAY_IN_SECONDS = 86400
const HOURLY_LIMIT = 5
const DAILY_LIMIT = 15

export const alertsHandler = {
    [NotificationStatus.NEVER]: async (_: IssueParams): Promise<void> => Promise.resolve(),
    [NotificationStatus.ALWAYS]: async (params: IssueParams): Promise<void> => sendAlertOnFlowRun(params),
    [NotificationStatus.NEW_ISSUE]: async (params: IssueParams): Promise<void> => sendAlertOnNewIssue(params),
}

async function sendAlertOnNewIssue(params: IssueParams): Promise<void> {
    const { platformId, issueCount } = params
    if (issueCount > 1) {
        return
    }

    const issueUrl = await platformDomainHelper.constructUrlFrom({
        platformId,
        path: 'runs?limit=10#Issues',
    })

    await emailService.sendIssueCreatedNotification({
        ...params,
        issueOrRunsPath: issueUrl,
        isIssue: true,
    })
}

async function sendAlertOnFlowRun(params: IssueParams): Promise<void> {
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

    const flowRunsUrl = await platformDomainHelper.constructUrlFrom({
        platformId,
        path: `runs/${flowRunId}`,
    })

    await emailService.sendIssueCreatedNotification({
        ...params,
        issueOrRunsPath: flowRunsUrl,
        isIssue: false,
    })
}

async function incrementAndExpire(key: string, expiryTime: number): Promise<number> {
    const redis = getRedisConnection()
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