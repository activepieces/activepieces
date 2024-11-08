import { EntitySchema, ObjectLiteral } from 'typeorm'
import Paginator, { Order } from './paginator'

export type PagingQuery = {
    afterCursor?: string
    beforeCursor?: string
    limit?: number
    order?: Order | 'ASC' | 'DESC'
    orderBy?: string
}

export type PaginationOptions<Entity> = {
    entity: EntitySchema<Entity>
    alias?: string
    query?: PagingQuery
}

export function buildPaginator<Entity extends ObjectLiteral>(
    options: PaginationOptions<Entity>,
): Paginator<Entity> {
    const {
        entity,
        query = {},
        alias = entity.options.name.toLowerCase(),
    } = options

    const paginator = new Paginator<Entity>(entity)

    paginator.setAlias(alias)

    if (query.afterCursor) {
        paginator.setAfterCursor(query.afterCursor)
    }

    if (query.beforeCursor) {
        paginator.setBeforeCursor(query.beforeCursor)
    }

    if (query.limit) {
        paginator.setLimit(query.limit)
    }

    if (query.order) {
        paginator.setOrder(query.order as Order)
    }

    if (query.orderBy) {
        paginator.setOrderBy(query.orderBy)
    }

    return paginator
}
