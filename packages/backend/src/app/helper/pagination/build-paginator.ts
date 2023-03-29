import { EntitySchema, ObjectLiteral } from "typeorm";
import Paginator, { Order } from "./paginator";

export interface PagingQuery {
    afterCursor?: string;
    beforeCursor?: string;
    limit?: number;
    order?: Order | "ASC" | "DESC";
}

export interface PaginationOptions<Entity> {
    entity: EntitySchema<Entity>;
    alias?: string;
    query?: PagingQuery;
    paginationKeys: Array<Extract<keyof Entity, string>>;
}

export function buildPaginator<Entity extends ObjectLiteral>(options: PaginationOptions<Entity>): Paginator<Entity> {
    const { entity, query = {}, alias = entity.options.name.toLowerCase(), paginationKeys } = options;

    const paginator = new Paginator(entity, paginationKeys);

    paginator.setAlias(alias);

    if (query.afterCursor) {
        paginator.setAfterCursor(query.afterCursor);
    }

    if (query.beforeCursor) {
        paginator.setBeforeCursor(query.beforeCursor);
    }

    if (query.limit) {
        paginator.setLimit(query.limit);
    }

    if (query.order) {
        paginator.setOrder(query.order as Order);
    }

    return paginator;
}
