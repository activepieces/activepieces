import { Alert, AlertEvent, CreateAlertParams, ListAlertsParams, UpdateAlertParams } from '@activepieces/ee-shared'
import { apId, ApId, ProjectId, SeekPage } from '@activepieces/shared'
import { FastifyBaseLogger } from 'fastify'
import { repoFactory } from '../../core/db/repo-factory'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { AlertEntity } from './alerts-entity'
import { AddAPArrayContainsToQueryBuilder } from '../../database/database-connection'
import { handlerAlertTrigger } from './alerts-handler'

const repo = repoFactory(AlertEntity)

export const alertsService = (log: FastifyBaseLogger) => ({
    async create(request: CreateAlertParams & { projectId: ProjectId }): Promise<Alert> {
        const alertId = apId()
        return await repo().save({
                ...request,
                id: alertId,
        })
    },
    async update({ id, request }: { id: string, request: UpdateAlertParams }): Promise<Alert> {
        await repo().update({ id }, {
            ...request,
        })
        return await repo().findOneByOrFail({ id })
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
    async trigger({projectId, event, payload}: TriggerParams): Promise<void> {
        const qb = await repo().createQueryBuilder('alert').where('alert.projectId = :projectId', { projectId })
        AddAPArrayContainsToQueryBuilder(qb, 'events', [event])
        const alerts = await qb.getMany()
        log.info({ name: 'alertsService#trigger' }, `Found ${alerts.length} alerts for event ${event} in project ${projectId}`)

        await Promise.all(alerts.map((alert) => handlerAlertTrigger(alert, event, payload, log)))
    },
})

type TriggerParams = {
    projectId: ProjectId,
    event: AlertEvent,
    payload: unknown,
}
