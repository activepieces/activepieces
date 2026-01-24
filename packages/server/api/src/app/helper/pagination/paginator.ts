import {
    Brackets,
    EntitySchema,
    ObjectLiteral,
    SelectQueryBuilder,
    WhereExpressionBuilder,
} from 'typeorm'
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

export type OrderByConfig = {
    field: string
    order: Order
    sqlExpression?: string
}

const PAGINATION_KEY = 'created'

export default class Paginator<Entity extends ObjectLiteral> {
    public static readonly NO_LIMIT = -1

    private afterCursor: string | null = null

    private beforeCursor: string | null = null

    private nextAfterCursor: string | null = null

    private nextBeforeCursor: string | null = null

    private alias: string

    private limit = 100

    private order: Order = Order.DESC

    private orderBy: string = PAGINATION_KEY

    private compositeOrderBy: OrderByConfig[] | null = null

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

    public setCompositeOrderBy(orderByConfig: OrderByConfig[]): void {
        this.compositeOrderBy = orderByConfig
    }

    public async paginate<T = Entity>(
        builder: SelectQueryBuilder<Entity>,
    ): Promise<PagingResult<T>> {

        const result = await this.appendPagingQuery(builder).getRawAndEntities()

        const mergedData = result.entities.map((entity, index) => {
            const rawRow = result.raw[index]
            const additionalColumns: Record<string, unknown> = {}

            for (const [key, value] of Object.entries(rawRow)) {
                if (!key.startsWith(`${this.alias}_`)) {
                    additionalColumns[key] = value
                }
            }
            
            return {
                ...entity,
                ...additionalColumns,
            } as T
        })

        if (this.isUnlimited()) {
            return {
                data: mergedData,
                cursor: { beforeCursor: null, afterCursor: null },
            }
        }

        const hasMore = mergedData.length > this.limit

        if (hasMore) {
            mergedData.splice(mergedData.length - 1, 1)
        }

        if (mergedData.length === 0) {
            return this.toPagingResult(mergedData)
        }

        if (!this.hasAfterCursor() && this.hasBeforeCursor()) {
            mergedData.reverse()
        }

        if (this.hasBeforeCursor() || hasMore) {
            this.nextAfterCursor = this.encode(mergedData[mergedData.length - 1] as unknown as Entity)
        }

        if (this.hasAfterCursor() || (hasMore && this.hasBeforeCursor())) {
            this.nextBeforeCursor = this.encode(mergedData[0] as unknown as Entity)
        }
        
        return this.toPagingResult(mergedData)
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

        if (!this.isUnlimited()) {
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
        }

        for (const [key, value] of Object.entries(this.buildOrder())) {
            clonedBuilder.addOrderBy(key, value)
        }
        return clonedBuilder
    }

    private buildCursorQuery(
        where: WhereExpressionBuilder,
        cursors: CursorParam,
    ): void {
        if (this.compositeOrderBy) {
            this.buildCompositeCursorQuery(where, cursors)
            return
        }

        const operator = this.getOperator()
        const queryString = `DATE_TRUNC('second', ${this.alias}.${PAGINATION_KEY}) ${operator} DATE_TRUNC('second', :${PAGINATION_KEY}::timestamp)`

        where.orWhere(queryString, cursors)
    }

    private buildCompositeCursorQuery(
        where: WhereExpressionBuilder,
        cursors: CursorParam,
    ): void {
        where.andWhere(new Brackets((qb) => {
            for (let i = 0; i < this.compositeOrderBy!.length; i++) {
                qb.orWhere(new Brackets((subQb) => {
                    for (let j = 0; j < i; j++) {
                        const config = this.compositeOrderBy![j]
                        const paramKey = `cursor_eq_${j}_${i}`
                        subQb.andWhere(`${this.alias}.${config.field} = :${paramKey}`, {
                            [paramKey]: cursors[config.field],
                        })
                    }

                    const currentConfig = this.compositeOrderBy![i]
                    const currentParamKey = `cursor_cmp_${i}`
                    const operator = this.getOperatorForConfig(currentConfig)
                    subQb.andWhere(`${this.alias}.${currentConfig.field} ${operator} :${currentParamKey}`, {
                        [currentParamKey]: cursors[currentConfig.field],
                    })
                }))
            }
        }))
    }

    private getOperatorForConfig(config: OrderByConfig): string {
        if (this.hasAfterCursor()) {
            return config.order === Order.ASC ? '>' : '<'
        }

        if (this.hasBeforeCursor()) {
            return config.order === Order.ASC ? '<' : '>'
        }

        return '='
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
        if (this.compositeOrderBy) {
            const orderByCondition: Record<string, Order> = {}
            for (const config of this.compositeOrderBy) {
                let order = config.order
                if (!this.hasAfterCursor() && this.hasBeforeCursor()) {
                    order = this.flipOrder(order)
                }
                const expression = config.sqlExpression || `${this.alias}.${config.field}`
                orderByCondition[expression] = order
            }
            return orderByCondition
        }

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

    private isUnlimited(): boolean {
        return this.limit === Paginator.NO_LIMIT
    }

    private encode(entity: Entity): string {
        if (this.compositeOrderBy) {
            const cursorData: Record<string, unknown> = {}
            for (const config of this.compositeOrderBy) {
                cursorData[config.field] = entity[config.field]
            }
            return btoa(JSON.stringify(cursorData))
        }

        const type = this.getEntityPropertyType(PAGINATION_KEY)
        const value = encodeByType(type, entity[PAGINATION_KEY])
        const payload = `${PAGINATION_KEY}:${value}`

        return btoa(payload)
    }

    private decode(cursor: string): CursorParam {
        if (this.compositeOrderBy) {
            try {
                return JSON.parse(atob(cursor))
            }
            catch {
                return {}
            }
        }

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
