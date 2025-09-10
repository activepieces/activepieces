import { AppSystemProp } from '@activepieces/server-shared'
import {
    Brackets,
    EntitySchema,
    ObjectLiteral,
    SelectQueryBuilder,
    WhereExpressionBuilder,
} from 'typeorm'
import { DatabaseType, system } from '../system/system'
import { atob, btoa, decodeByType, encodeByType } from './pagination-utils'

export enum Order {
    ASC = 'ASC',
    DESC = 'DESC',
}

export type CursorParam = Record<string, unknown>

export type CursorResult = {
    beforeCursor: string | null
    afterCursor: string | null
}

export type PagingResult<Entity> = {
    data: Entity[]
    cursor: CursorResult
}

const PAGINATION_KEY = 'created'

export default class Paginator<Entity extends ObjectLiteral> {
    private afterCursor: string | null = null

    private beforeCursor: string | null = null

    private nextAfterCursor: string | null = null

    private nextBeforeCursor: string | null = null

    private alias: string

    private limit = 100

    private order: Order = Order.DESC

    private orderBy: string = PAGINATION_KEY

    public constructor(private readonly entity: EntitySchema) {
        this.alias = this.entity.options.name
    }

    public setAlias(alias: string): void {
        this.alias = alias
    }

    public setAfterCursor(cursor: string): void {
        this.afterCursor = cursor
    }

    public setBeforeCursor(cursor: string): void {
        this.beforeCursor = cursor
    }

    public setLimit(limit: number): void {
        this.limit = limit
    }

    public setOrder(order: Order): void {
        this.order = order
    }

    public setOrderBy(orderBy: string): void {
        this.orderBy = orderBy
    }

    public async paginate(
        builder: SelectQueryBuilder<Entity>,
    ): Promise<PagingResult<Entity>> {
        const entities = await this.appendPagingQuery(builder).getMany()
        const hasMore = entities.length > this.limit

        if (hasMore) {
            entities.splice(entities.length - 1, 1)
        }

        if (entities.length === 0) {
            return this.toPagingResult(entities)
        }

        if (!this.hasAfterCursor() && this.hasBeforeCursor()) {
            entities.reverse()
        }

        if (this.hasBeforeCursor() || hasMore) {
            this.nextAfterCursor = this.encode(entities[entities.length - 1])
        }

        if (this.hasAfterCursor() || (hasMore && this.hasBeforeCursor())) {
            this.nextBeforeCursor = this.encode(entities[0])
        }

        return this.toPagingResult(entities)
    }

    private getCursor(): CursorResult {
        return {
            afterCursor: this.nextAfterCursor,
            beforeCursor: this.nextBeforeCursor,
        }
    }

    private appendPagingQuery(
        builder: SelectQueryBuilder<Entity>,
    ): SelectQueryBuilder<Entity> {
        const cursors: CursorParam = {}
        const clonedBuilder = new SelectQueryBuilder<Entity>(builder)

        if (this.hasAfterCursor()) {
            Object.assign(cursors, this.decode(this.afterCursor!))
        }
        else if (this.hasBeforeCursor()) {
            Object.assign(cursors, this.decode(this.beforeCursor!))
        }

        if (Object.keys(cursors).length > 0) {
            clonedBuilder.andWhere(
                new Brackets((where) => this.buildCursorQuery(where, cursors)),
            )
        }

        clonedBuilder.take(this.limit + 1)
        for (const [key, value] of Object.entries(this.buildOrder())) {
            clonedBuilder.addOrderBy(key, value)
        }
        return clonedBuilder
    }

    private buildCursorQuery(
        where: WhereExpressionBuilder,
        cursors: CursorParam,
    ): void {
        const dbType = system.get(AppSystemProp.DB_TYPE)
        const operator = this.getOperator()
        let queryString: string

        if (dbType === DatabaseType.SQLITE3) {
            queryString = `strftime('%s', ${this.alias}.${PAGINATION_KEY}) ${operator} strftime('%s', :${PAGINATION_KEY})`
        }
        else if (dbType === DatabaseType.POSTGRES) {
            queryString = `DATE_TRUNC('second', ${this.alias}.${PAGINATION_KEY}) ${operator} DATE_TRUNC('second', :${PAGINATION_KEY}::timestamp)`
        }
        else {
            throw new Error('Unsupported database type')
        }

        where.orWhere(queryString, cursors)
    }

    private getOperator(): string {
        if (this.hasAfterCursor()) {
            return this.order === Order.ASC ? '>' : '<'
        }

        if (this.hasBeforeCursor()) {
            return this.order === Order.ASC ? '<' : '>'
        }

        return '='
    }

    private buildOrder(): Record<string, Order> {
        let { order } = this

        if (!this.hasAfterCursor() && this.hasBeforeCursor()) {
            order = this.flipOrder(order)
        }

        const orderByCondition: Record<string, Order> = {}
        orderByCondition[`${this.alias}.${this.orderBy}`] = order

        return orderByCondition
    }

    private hasAfterCursor(): boolean {
        return this.afterCursor !== null
    }

    private hasBeforeCursor(): boolean {
        return this.beforeCursor !== null
    }

    private encode(entity: Entity): string {
        const type = this.getEntityPropertyType(PAGINATION_KEY)
        const value = encodeByType(type, entity[PAGINATION_KEY])
        const payload = `${PAGINATION_KEY}:${value}`

        return btoa(payload)
    }

    private decode(cursor: string): CursorParam {
        const cursors: CursorParam = {}
        const columns = atob(cursor).split(',')
        columns.forEach((column) => {
            const [key, raw] = column.split(':')
            const type = this.getEntityPropertyType(key)
            const value = decodeByType(type, raw)
            cursors[key] = value
        })

        return cursors
    }

    private getEntityPropertyType(key: string): string {
        const col = this.entity.options.columns[key]
        if (col === undefined) {
            throw new Error('entity property not found ' + key)
        }
        return col.type.toString()
    }

    private flipOrder(order: Order): Order {
        return order === Order.ASC ? Order.DESC : Order.ASC
    }

    private toPagingResult<Entity>(entities: Entity[]): PagingResult<Entity> {
        return {
            data: entities,
            cursor: this.getCursor(),
        }
    }
}
