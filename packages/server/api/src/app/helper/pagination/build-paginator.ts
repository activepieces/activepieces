import { EntitySchema, ObjectLiteral } from 'typeorm'
import Paginator, { Order, OrderByConfig } from './paginator'

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

    if (query.orderBy) {
        paginator.setCompositeOrderBy(query.orderBy)
    }
    else if (query.order) {
        paginator.setCompositeOrderBy([{ field: 'created', order: toOrder(query.order) }])
    }

    return paginator
}

function toOrder(order: PagingQuery['order']): Order {
    return order === Order.ASC ? Order.ASC : Order.DESC
}

export type PagingQuery = {
    afterCursor?: string
    beforeCursor?: string
    limit?: number
    order?: Order | 'ASC' | 'DESC'
    orderBy?: OrderByConfig[]
}

export type PaginationOptions<Entity> = {
    entity: EntitySchema<Entity>
    alias?: string
    query?: PagingQuery
}
