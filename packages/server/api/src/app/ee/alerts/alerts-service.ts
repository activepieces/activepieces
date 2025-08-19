import { Alert, AlertChannel, ListAlertsParams } from '@activepieces/ee-shared'
import { ActivepiecesError, apId, ApId, ErrorCode, PopulatedIssue, SeekPage } from '@activepieces/shared'
import dayjs from 'dayjs'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { flowVersionService } from '../../flows/flow-version/flow-version.service'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { platformService } from '../../platform/platform.service'
import { projectService } from '../../project/project-service'
import { AlertEntity } from './alerts-entity'
import { alertsHandler } from './alerts-handler'

const repo = repoFactory(AlertEntity)

export const alertsService = (log: FastifyBaseLogger) => ({
    async sendAlertOnRunFinish({ issue, flowRunId }: { issue: PopulatedIssue, flowRunId: string }): Promise<void> {
        const project = await projectService.getOneOrThrow(issue.projectId)
        const platform = await platformService.getOneWithPlanOrThrow(project.platformId)
        if (platform.plan.embeddingEnabled) {
            return
        }

        const flowVersion = await flowVersionService(log).getLatestLockedVersionOrThrow(issue.flowId)

        await alertsHandler(log)[project.notifyStatus]({
            flowRunId,
            projectId: issue.projectId,
            platformId: platform.id,
            flowId: issue.flowId,
            flowName: flowVersion.displayName,
            issueCount: issue.count,
            createdAt: dayjs(issue.created).tz('America/Los_Angeles').format('DD MMM YYYY, HH:mm [PT]'),
        })
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
})

type AddPrams = { 
    projectId: string
    channel: AlertChannel
    receiver: string 
}