import { ActivepiecesError, ApId, apId, ErrorCode, isNil, SeekPage, tryCatch } from '@activepieces/core-utils'
import { apDayjsDuration } from '@activepieces/server-utils'
import { Alert, AlertChannel, ApEdition, FailedStep, flowStructureUtil, ListAlertsParams, ProjectType } from '@activepieces/shared'

import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import { FastifyBaseLogger } from 'fastify'
import { userIdentityService } from '../../authentication/user-identity/user-identity-service'
import { repoFactory } from '../../core/db/repo-factory'
import { redisConnections } from '../../database/redis-connections'
import { flowRepo } from '../../flows/flow/flow.repo'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { domainHelper } from '../../helper/domain-helper'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { system } from '../../helper/system/system'
import { projectService } from '../../project/project-service'
import { userService } from '../../user/user-service'
import { emailService } from '../helper/email/email-service'
import { AlertEntity } from './alerts-entity'

dayjs.extend(timezone)

const repo = repoFactory(AlertEntity)
const DAY_IN_SECONDS = apDayjsDuration(1, 'day').asSeconds()
const MAX_ALERT_EMAILS = 50
const alertEventKey = (flowVersionId: string) => `flow_fail_count:${flowVersionId}`
const paidEditions = [ApEdition.CLOUD, ApEdition.ENTERPRISE].includes(system.getEdition())

export const alertsService = (log: FastifyBaseLogger) => ({
    async sendAlertOnRunFinish({
        issueToAlert,
        flowRunId,
        failedStep,
    }: {
        issueToAlert: IssueToAlert
        flowRunId: string
        failedStep: FailedStep
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

        const project = await projectService(log).getOneOrThrow(issueToAlert.projectId)
        const ownerAlertsEnabled = project.type === ProjectType.TEAM && project.flowOwnerAlertsEnabled
        const [flowVersion, flowOwnerEmail] = await Promise.all([
            flowVersionService(log).getOneOrThrow(issueToAlert.flowVersionId),
            ownerAlertsEnabled ? getFlowOwnerEmail({
                log,
                flowId: issueToAlert.flowId,
                projectId: issueToAlert.projectId,
                platformId: project.platformId,
            }) : Promise.resolve(undefined),
        ])

        const failedStepNumber = flowStructureUtil.getStepNumber(flowVersion.trigger, failedStep.name)
        const alertsInfo: IssueParams = {
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
            failedStepDisplayName: failedStep.displayName,
            failedStepNumber: failedStepNumber > 0 ? failedStepNumber : undefined,
            failedStepMessage: failedStep.message,
            flowOwnerEmail,
        }

        await sendAlertOnFlowFailure(log, alertsInfo)
    },
    async add({ projectId, channel, receiver }: AddPrams): Promise<void> {
        const normalizedReceiver = receiver.toLowerCase()
        const project = await projectService(log).getOneOrThrow(projectId)
        if (project.type === ProjectType.PERSONAL) {
            const owner = await userService(log).getOneOrFail({ id: project.ownerId })
            const identity = await userIdentityService(log).getOneOrFail({ id: owner.identityId })
            if (identity.email.toLowerCase() !== normalizedReceiver) {
                throw new ActivepiecesError({
                    code: ErrorCode.VALIDATION,
                    params: {
                        message: 'Personal projects only allow the project owner as alert receiver',
                    },
                })
            }
        }
        const alertId = apId()
        const existingAlert = await repo()
            .createQueryBuilder('alert')
            .where('alert."projectId" = :projectId', { projectId })
            .andWhere('LOWER(alert.receiver) = :receiver', { receiver: normalizedReceiver })
            .getOne()

        if (existingAlert) {
            throw new ActivepiecesError({
                code: ErrorCode.EXISTING_ALERT_CHANNEL,
                params: {
                    email: normalizedReceiver,
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
                receiver: normalizedReceiver,
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
})

async function getFlowOwnerEmail({ log, flowId, projectId, platformId }: GetFlowOwnerEmailParams): Promise<string | undefined> {
    const { data: ownerEmail, error } = await tryCatch(async () => {
        const flow = await flowRepo().findOneBy({ id: flowId, projectId })
        if (isNil(flow) || isNil(flow.ownerId)) {
            return undefined
        }
        const owner = await userService(log).getMetaInformation({ id: flow.ownerId })
        if (owner.platformId !== platformId) {
            return undefined
        }
        return owner.email
    })
    if (error) {
        log.warn({ error, flow: { id: flowId } }, 'Failed to resolve flow owner email for alert')
        return undefined
    }
    return ownerEmail ?? undefined
}

async function sendAlertOnFlowFailure(log: FastifyBaseLogger, params: IssueParams): Promise<void> {
    const { flowRunId, projectId, flowOwnerEmail } = params

    const alerts = await alertsService(log).list({ projectId, cursor: undefined, limit: MAX_ALERT_EMAILS })
    const receivers = alerts.data.filter((alert) => alert.channel === AlertChannel.EMAIL).map((alert) => alert.receiver)
    const ownerEmailLower = flowOwnerEmail?.toLowerCase()
    const shouldAddOwner = !isNil(flowOwnerEmail) && !receivers.some((receiver) => receiver.toLowerCase() === ownerEmailLower)
    const emails = shouldAddOwner ? [...receivers, flowOwnerEmail] : receivers

    if (emails.length === 0) {
        log.info({ project: { id: projectId }, flowRun: { id: flowRunId } }, 'No alert recipients configured, skipping issue-created email')
        return
    }

    const runUrl = await domainHelper.getInternalUrl({
        path: `projects/${projectId}/runs/${flowRunId}`,
    })

    await emailService(log).sendIssueCreatedNotification({
        emails,
        projectId,
        projectName: params.projectName,
        flowName: params.flowName,
        platformId: params.platformId,
        createdAt: params.createdAt,
        failedStepDisplayName: params.failedStepDisplayName,
        failedStepNumber: params.failedStepNumber,
        failedStepMessage: params.failedStepMessage,
        runUrl,
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
    failedStepDisplayName: string
    failedStepNumber?: number
    failedStepMessage?: string
    flowOwnerEmail?: string
}

type GetFlowOwnerEmailParams = {
    log: FastifyBaseLogger
    flowId: string
    projectId: string
    platformId: string
}

type IssueToAlert = {
    flowVersionId: string
    projectId: string
    flowId: string
    created: string
}
