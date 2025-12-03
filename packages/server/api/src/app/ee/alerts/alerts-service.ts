import { Alert, AlertChannel, ListAlertsParams } from '@activepieces/ee-shared'
import { apDayjsDuration } from '@activepieces/server-shared'
import { ActivepiecesError, ApEdition, apId, ApId, ErrorCode, SeekPage } from '@activepieces/shared'

import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { redisConnections } from '../../database/redis-connections'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { system } from '../../helper/system/system'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { systemJobsSchedule } from '../../helper/system-jobs/system-job'
import { projectService } from '../../project/project-service'
import { domainHelper } from '../custom-domains/domain-helper'
import { emailService } from '../helper/email/email-service'
import { AlertEntity } from './alerts-entity'

dayjs.extend(timezone)

const repo = repoFactory(AlertEntity)
const DAY_IN_SECONDS = apDayjsDuration(1, 'day').asSeconds()
const alertEventKey = (flowVersionId: string) => `flow_fail_count:${flowVersionId}`
const paidEditions = [ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(system.getEdition())

export const alertsService = (log: FastifyBaseLogger) => ({
    async sendAlertOnRunFinish({
        issueToAlert,
        flowRunId,
    }: {
        issueToAlert: IssueToAlert
        flowRunId: string
    }): Promise<void> {
        if (!paidEditions) {
            return
        }

        const redisConnection = await redisConnections.useExisting()
        const failureKey = alertEventKey(issueToAlert.flowVersionId)
        const numberOfFailures = await redisConnection.incrby(failureKey, 1)
        await redisConnection.expire(failureKey, DAY_IN_SECONDS)

        if (numberOfFailures > 1) {
            return
        }

        const project = await projectService.getOneOrThrow(issueToAlert.projectId)
        const flowVersion = await flowVersionService(log).getLatestLockedVersionOrThrow(issueToAlert.flowId)

        const alertsInfo = {
            flowVersionId: flowVersion.id,
            flowRunId,
            projectId: issueToAlert.projectId,
            platformId: project.platformId,
            projectName: project.displayName,
            flowId: issueToAlert.flowId,
            flowName: flowVersion.displayName,
            createdAt: dayjs(issueToAlert.created)
                .tz('America/Los_Angeles')
                .format('DD MMM YYYY, HH:mm [PT]'),
        }

        const globalAlertsKey = `alerts:flowFailures:${project.platformId}:${issueToAlert.projectId}`
        await redisConnection.rpush(globalAlertsKey, JSON.stringify(alertsInfo))
        await redisConnection.expire(globalAlertsKey, DAY_IN_SECONDS)

        await sendAlertOnFlowFailure(log, alertsInfo)
        await scheduleIssuesSummary(log, alertsInfo)
    },
    async add({ projectId, channel, receiver }: AddPrams): Promise<void> {
        const alertId = apId()
        const existingAlert = await repo().findOneBy({
            projectId,
            receiver,
        })

        if (existingAlert) {
            throw new ActivepiecesError({
                code: ErrorCode.EXISTING_ALERT_CHANNEL,
                params: {
                    email: receiver,
                },
            })
        }

        await repo().createQueryBuilder()
            .insert()
            .into(AlertEntity)
            .values({
                id: alertId,
                channel,
                projectId,
                receiver,
                created: dayjs().toISOString(),
            })
            .execute()
    },
    async list({ projectId, cursor, limit }: ListAlertsParams): Promise<SeekPage<Alert>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor ?? null)
        const paginator = buildPaginator({
            entity: AlertEntity,
            query: {
                limit,
                order: 'ASC',
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const query = repo().createQueryBuilder(AlertEntity.options.name).where({
            projectId,
        })

        const { data, cursor: newCursor } = await paginator.paginate(query)
        return paginationHelper.createPage<Alert>(data, newCursor)
    },
    async delete({ alertId }: { alertId: ApId }): Promise<void> {
        await repo().delete({
            id: alertId,
        })
    },
    async runScheduledReminderJob(data: SystemJobData<SystemJobName.ISSUES_SUMMARY>): Promise<void> {
        await emailService(log).sendIssuesSummary({
            projectId: data.projectId,
            projectName: data.projectName,
            platformId: data.platformId,
        })
    },
})

async function sendAlertOnFlowFailure(log: FastifyBaseLogger, params: IssueParams): Promise<void> {
    const { platformId, flowRunId, projectId } = params

    const issueUrl = await domainHelper.getPublicUrl({
        platformId,
        path: `projects/${projectId}/runs/${flowRunId}`,
    })

    await emailService(log).sendIssueCreatedNotification({
        ...params,
        issueOrRunsPath: issueUrl,
        isIssue: true,
    })
}

async function scheduleIssuesSummary(log: FastifyBaseLogger, params: IssueParams): Promise<void> {
    const endOfDay = dayjs().endOf('day')
    await systemJobsSchedule(log).upsertJob({
        job: {
            name: SystemJobName.ISSUES_SUMMARY,
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

type AddPrams = {
    projectId: string
    channel: AlertChannel
    receiver: string
}

type IssueParams = {
    projectId: string
    flowVersionId: string
    projectName: string
    platformId: string
    flowId: string
    flowRunId: string
    flowName: string
    createdAt: string
}

type IssueToAlert = {
    flowVersionId: string
    projectId: string
    flowId: string
    created: string
}