import {
    Brackets,
    EntitySchema,
    ObjectLiteral,
    OrderByCondition,
    SelectQueryBuilder,
    WhereExpressionBuilder,
} from 'typeorm';
import { atob, btoa, decodeByType, encodeByType } from './pagination-utils';

export enum Order {
    ASC = 'ASC',
    DESC = 'DESC',
}

export type CursorParam = Record<string, any>;

export interface CursorResult {
    beforeCursor: string | null;
    afterCursor: string | null;
}

export interface PagingResult<Entity> {
    data: Entity[];
    cursor: CursorResult;
}

export default class Paginator<Entity extends ObjectLiteral> {
    private afterCursor: string | null = null;

    private beforeCursor: string | null = null;

    private nextAfterCursor: string | null = null;

    private nextBeforeCursor: string | null = null;

    private alias: string = this.entity.options.name;

    private limit = 100;

    private order: Order = Order.DESC;

    public constructor(
        private readonly entity: EntitySchema,
        private readonly paginationKeys: Array<Extract<keyof Entity, string>>,
    ) {}

    public setAlias(alias: string): void {
        this.alias = alias;
    }

    public setAfterCursor(cursor: string): void {
        this.afterCursor = cursor;
    }

    public setBeforeCursor(cursor: string): void {
        this.beforeCursor = cursor;
    }

    public setLimit(limit: number): void {
        this.limit = limit;
    }

    public setOrder(order: Order): void {
        this.order = order;
    }

    public async paginate(builder: SelectQueryBuilder<Entity>): Promise<PagingResult<Entity>> {
        const entities = await this.appendPagingQuery(builder).getMany();
        const hasMore = entities.length > this.limit;

        if (hasMore) {
            entities.splice(entities.length - 1, 1);
        }

        if (entities.length === 0) {
            return this.toPagingResult(entities);
        }

        if (!this.hasAfterCursor() && this.hasBeforeCursor()) {
            entities.reverse();
        }

        if (this.hasBeforeCursor() || hasMore) {
            this.nextAfterCursor = this.encode(entities[entities.length - 1]);
        }

        if (this.hasAfterCursor() || (hasMore && this.hasBeforeCursor())) {
            this.nextBeforeCursor = this.encode(entities[0]);
        }

        return this.toPagingResult(entities);
    }

    private getCursor(): CursorResult {
        return {
            afterCursor: this.nextAfterCursor,
            beforeCursor: this.nextBeforeCursor,
        };
    }

    private appendPagingQuery(builder: SelectQueryBuilder<Entity>): SelectQueryBuilder<Entity> {
        const cursors: CursorParam = {};
        const clonedBuilder = new SelectQueryBuilder<Entity>(builder);

        if (this.hasAfterCursor()) {
            Object.assign(cursors, this.decode(this.afterCursor as string));
        }
        else if (this.hasBeforeCursor()) {
            Object.assign(cursors, this.decode(this.beforeCursor as string));
        }

        if (Object.keys(cursors).length > 0) {
            clonedBuilder.andWhere(new Brackets((where) => this.buildCursorQuery(where, cursors)));
        }

        clonedBuilder.take(this.limit + 1);
        clonedBuilder.orderBy(this.buildOrder());

        return clonedBuilder;
    }

    private buildCursorQuery(where: WhereExpressionBuilder, cursors: CursorParam): void {
        const operator = this.getOperator();
        const params: CursorParam = {};
        let query = '';
        this.paginationKeys.forEach((key) => {
            params[key] = cursors[key];
            where.orWhere(`${query}${this.alias}.${key} ${operator} :${key}`, params);
            query = `${query}${this.alias}.${key} = :${key} AND `;
        });
    }

    private getOperator(): string {
        if (this.hasAfterCursor()) {
            return this.order === Order.ASC ? '>' : '<';
        }

        if (this.hasBeforeCursor()) {
            return this.order === Order.ASC ? '<' : '>';
        }

        return '=';
    }

    private buildOrder(): OrderByCondition {
        let { order } = this;

        if (!this.hasAfterCursor() && this.hasBeforeCursor()) {
            order = this.flipOrder(order);
        }

        const orderByCondition: OrderByCondition = {};
        this.paginationKeys.forEach((key) => {
            orderByCondition[`${this.alias}.${key}`] = order;
        });

        return orderByCondition;
    }

    private hasAfterCursor(): boolean {
        return this.afterCursor !== null;
    }

    private hasBeforeCursor(): boolean {
        return this.beforeCursor !== null;
    }

    private encode(entity: Entity): string {
        const payload = this.paginationKeys
            .map((key) => {
                const type = this.getEntityPropertyType(key);
                const value = encodeByType(type, entity[key]);
                return `${key}:${value}`;
            })
            .join(',');

        return btoa(payload);
    }

    private decode(cursor: string): CursorParam {
        const cursors: CursorParam = {};
        const columns = atob(cursor).split(',');
        columns.forEach((column) => {
            const [key, raw] = column.split(':');
            const type = this.getEntityPropertyType(key);
            const value = decodeByType(type, raw);
            cursors[key] = value;
        });

        return cursors;
    }

    private getEntityPropertyType(key: string): string {
        const col = this.entity.options.columns[key];
        if (col === undefined) {
            throw new Error('entity property not found ' + key);
        }
        return col.type.toString();
    }

    private flipOrder(order: Order): Order {
        return order === Order.ASC ? Order.DESC : Order.ASC;
    }

    private toPagingResult<Entity>(entities: Entity[]): PagingResult<Entity> {
        return {
            data: entities,
            cursor: this.getCursor(),
        };
    }
}
