import { Activity } from '@activepieces/ee-shared'
import { Cursor, ProjectId, SeekPage, apId } from '@activepieces/shared'
import { databaseConnection } from '../../database/database-connection'
import { ActivityEntity } from './activity-entity'
import { paginationHelper } from '../../helper/pagination/pagination-utils'
import { buildPaginator } from '../../helper/pagination/build-paginator'
import { Order } from '../../helper/pagination/paginator'

const repo = databaseConnection.getRepository(ActivityEntity)

export const activityService = {
    async add(params: AddParams): Promise<Activity> {
        const newActivity: Activity = {
            id: apId(),
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            ...params,
        }

        return repo.save(newActivity)
    },

    async list({ projectId, cursor, limit }: ListParams): Promise<SeekPage<Activity>> {
        const decodedCursor = paginationHelper.decodeCursor(cursor)

        const paginator = buildPaginator({
            entity: ActivityEntity,
            query: {
                limit,
                order: Order.DESC,
                afterCursor: decodedCursor.nextCursor,
                beforeCursor: decodedCursor.previousCursor,
            },
        })

        const query = repo.createQueryBuilder(ActivityEntity.options.name).where({
            projectId,
        })

        const { data, cursor: newCursor } = await paginator.paginate(query)

        return paginationHelper.createPage(data, newCursor)
    },
}

type AddParams = {
    projectId: ProjectId
    event: string
    message: string
    status: string
}

type ListParams = {
    projectId: ProjectId
    cursor: Cursor | null
    limit: number
}
