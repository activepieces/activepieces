import { isNil, tryCatchSync } from '@activepieces/core-utils'
import {
    Brackets,
    EntitySchema,
    ObjectLiteral,
    SelectQueryBuilder,
    WhereExpressionBuilder,
} from 'typeorm'
import { atob, btoa, decodeByType } from './pagination-utils'

export default class Paginator<Entity extends ObjectLiteral> {
    public static readonly NO_LIMIT = -1

    private afterCursor: string | null = null

    private beforeCursor: string | null = null

    private nextAfterCursor: string | null = null

    private nextBeforeCursor: string | null = null

    private alias: string

    private limit = 100

    private compositeOrderBy = withIdTiebreaker([{ field: 'created', order: Order.DESC }])

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

    public setCompositeOrderBy(orderByConfig: OrderByConfig[]): void {
        this.compositeOrderBy = withIdTiebreaker(orderByConfig)
    }

    public async paginate<T = Entity>(
        builder: SelectQueryBuilder<Entity>,
    ): Promise<PagingResult<T>> {

        const result = await this.appendPagingQuery(builder).getRawAndEntities()

        const rawByEntityId = new Map<unknown, Record<string, unknown>>()
        for (const raw of result.raw) {
            const rawId = raw?.[`${this.alias}_id`]
            if (!isNil(rawId) && !rawByEntityId.has(rawId)) {
                rawByEntityId.set(rawId, raw)
            }
        }

        const rows = result.entities.map((entity, index) => ({
            entity,
            raw: rawByEntityId.get(entity.id) ?? result.raw[index],
        }))

        if (!this.isUnlimited()) {
            const hasMore = rows.length > this.limit

            if (hasMore) {
                rows.pop()
            }

            if (!this.hasAfterCursor() && this.hasBeforeCursor()) {
                rows.reverse()
            }

            if (rows.length > 0) {
                if (this.hasBeforeCursor() || hasMore) {
                    this.nextAfterCursor = this.encode(rows[rows.length - 1])
                }

                if (this.hasAfterCursor() || (hasMore && this.hasBeforeCursor())) {
                    this.nextBeforeCursor = this.encode(rows[0])
                }
            }
        }

        return this.toPagingResult(rows.map((row) => this.mergeAdditionalColumns<T>(row)))
    }

    private mergeAdditionalColumns<T>({ entity, raw }: PaginatedRow<Entity>): T {
        const additionalColumns: Record<string, unknown> = {}

        for (const [key, value] of Object.entries(raw ?? {})) {
            if (!key.startsWith(`${this.alias}_`) && !key.startsWith(CURSOR_SELECT_PREFIX)) {
                additionalColumns[key] = value
            }
        }

        return {
            ...entity,
            ...additionalColumns,
        } as T
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
        const clonedBuilder = new SelectQueryBuilder<Entity>(builder)

        if (!this.isUnlimited()) {
            const cursors: CursorParam = {}

            if (this.hasAfterCursor()) {
                Object.assign(cursors, this.decode(this.afterCursor ?? ''))
            }
            else if (this.hasBeforeCursor()) {
                Object.assign(cursors, this.decode(this.beforeCursor ?? ''))
            }

            const missingFieldIndex = this.compositeOrderBy.findIndex(
                (config) => isNil(cursors[config.field]),
            )
            const configsInCursor = missingFieldIndex === -1
                ? this.compositeOrderBy
                : this.compositeOrderBy.slice(0, missingFieldIndex)

            if (configsInCursor.length > 0) {
                clonedBuilder.andWhere(
                    new Brackets((where) => this.buildCursorQuery({ where, cursors, configs: configsInCursor })),
                )
            }

            clonedBuilder.take(this.limit + 1)

            for (const config of this.timestampFields()) {
                clonedBuilder.addSelect(
                    `"${this.alias}"."${this.getColumnName(config.field)}"::text`,
                    `${CURSOR_SELECT_PREFIX}${config.field}`,
                )
            }
        }

        for (const [key, value] of Object.entries(this.buildOrder())) {
            clonedBuilder.addOrderBy(key, value)
        }
        return clonedBuilder
    }

    private buildCursorQuery({ where, cursors, configs }: BuildCursorQueryParams): void {
        for (let i = 0; i < configs.length; i++) {
            where.orWhere(new Brackets((subQb) => {
                for (let j = 0; j < i; j++) {
                    const config = configs[j]
                    const paramKey = `cursor_eq_${j}_${i}`
                    subQb.andWhere(`${this.alias}.${config.field} = :${paramKey}`, {
                        [paramKey]: cursors[config.field],
                    })
                }

                const currentConfig = configs[i]
                const currentParamKey = `cursor_cmp_${i}`
                const operator = this.getOperatorForConfig(currentConfig)
                subQb.andWhere(`${this.alias}.${currentConfig.field} ${operator} :${currentParamKey}`, {
                    [currentParamKey]: cursors[currentConfig.field],
                })
            }))
        }
    }

    private getOperatorForConfig(config: OrderByConfig): string {
        if (this.hasAfterCursor()) {
            return config.order === Order.ASC ? '>' : '<'
        }

        return config.order === Order.ASC ? '<' : '>'
    }

    private buildOrder(): Record<string, Order> {
        const orderByCondition: Record<string, Order> = {}

        for (const config of this.compositeOrderBy) {
            let { order } = config
            if (!this.hasAfterCursor() && this.hasBeforeCursor()) {
                order = this.flipOrder(order)
            }
            orderByCondition[`${this.alias}.${config.field}`] = order
        }

        return orderByCondition
    }

    private timestampFields(): OrderByConfig[] {
        return this.compositeOrderBy.filter((config) => this.isTimestampColumn(config.field))
    }

    private isTimestampColumn(key: string): boolean {
        const col = this.entity.options.columns[key]
        return col !== undefined && TIMESTAMP_COLUMN_TYPES.includes(col.type.toString())
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

    private encode(row: PaginatedRow<Entity>): string {
        const cursorData: Record<string, unknown> = {}

        for (const config of this.compositeOrderBy) {
            const rawCursorValue = row.raw?.[`${CURSOR_SELECT_PREFIX}${config.field}`]
            cursorData[config.field] = rawCursorValue ?? row.entity[config.field]
        }

        return btoa(JSON.stringify(cursorData))
    }

    private decode(cursor: string): CursorParam {
        const { data: parsed, error } = tryCatchSync(() => JSON.parse(atob(cursor)) as unknown)

        if (error) {
            return this.decodeLegacyCursor(cursor)
        }

        if (typeof parsed !== 'object' || isNil(parsed) || Array.isArray(parsed)) {
            return {}
        }

        const cursors: CursorParam = {}
        for (const [key, value] of Object.entries(parsed)) {
            if (typeof value !== 'string' && typeof value !== 'number') {
                continue
            }
            if (this.isTimestampColumn(key) && (typeof value !== 'string' || !isParseableTimestamp(value))) {
                continue
            }
            cursors[key] = value
        }
        return cursors
    }

    private decodeLegacyCursor(cursor: string): CursorParam {
        const { data } = tryCatchSync(() => {
            const cursors: CursorParam = {}

            for (const column of atob(cursor).split(',')) {
                const [key, raw] = column.split(':')
                const columnDefinition = this.entity.options.columns[key]
                if (columnDefinition === undefined) {
                    continue
                }
                cursors[key] = decodeByType(columnDefinition.type.toString(), raw)
            }

            return cursors
        })

        return data ?? {}
    }

    private getColumnName(key: string): string {
        return this.entity.options.columns[key]?.name ?? key
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

function isParseableTimestamp(value: string): boolean {
    return TIMESTAMP_TEXT_PATTERN.test(value) || !Number.isNaN(Date.parse(value))
}

function withIdTiebreaker(orderByConfig: OrderByConfig[]): OrderByConfig[] {
    if (orderByConfig.some((config) => config.field === 'id')) {
        return orderByConfig
    }

    return [
        ...orderByConfig,
        { field: 'id', order: orderByConfig[orderByConfig.length - 1]?.order ?? Order.DESC },
    ]
}

const CURSOR_SELECT_PREFIX = 'ap_cursor_'

const TIMESTAMP_TEXT_PATTERN = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}(:?\d{2})?|Z)?$/

const TIMESTAMP_COLUMN_TYPES = [
    'timestamp with time zone',
    'timestamp',
    'datetime',
    'date',
]

type PaginatedRow<Entity> = {
    entity: Entity
    raw: Record<string, unknown> | undefined
}

type CursorParam = Record<string, unknown>

type BuildCursorQueryParams = {
    where: WhereExpressionBuilder
    cursors: CursorParam
    configs: OrderByConfig[]
}

export enum Order {
    ASC = 'ASC',
    DESC = 'DESC',
}

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
}
