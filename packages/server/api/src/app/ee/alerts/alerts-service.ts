import dayjs from 'dayjs'
import { databaseConnection } from '../../database/database-connection'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { AlertEntity } from './alerts-entity'
import { Alert, AlertChannel, ListAlertsParams } from '@activepieces/ee-shared'
import { ApId, apId, SeekPage } from '@activepieces/shared'

const repo = databaseConnection.getRepository(AlertEntity)

export const alertsService = {
    async add({ projectId, channel, details }: AddPrams): Promise<void> {
        const alertId = apId()
        await repo.createQueryBuilder()
            .insert()
            .into(AlertEntity)
            .values({
                id: alertId,
                channel,
                projectId,
                details,
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

        const query = repo.createQueryBuilder(AlertEntity.options.name).where({
            projectId,
        })

        const { data, cursor: newCursor } = await paginator.paginate(query)

        return paginationHelper.createPage<Alert>(data, newCursor)
    },
    async delete({ alertId }: { alertId: ApId }): Promise<void> {
        await repo.delete({
            id: alertId,
        })
    },
}

type AddPrams = { 
    projectId: string
    channel: AlertChannel
    details: string 
}