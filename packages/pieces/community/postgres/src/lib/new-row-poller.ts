import crypto from 'crypto';
import { Client } from 'pg';
import format from 'pg-format';

function isOrderDirection(value: unknown): value is OrderDirection {
    return value === 'ASC' || value === 'DESC';
}

function valueFilters({ column, typeName, direction }: { column: string; typeName: string | null; direction: OrderDirection }): string[] {
    if (typeName === 'numeric' || typeName === 'float4' || typeName === 'float8') {
        return [`t.${column}::text NOT IN ('NaN', 'Infinity', '-Infinity')`];
    }
    if (typeName !== 'timestamptz' && typeName !== 'timestamp' && typeName !== 'date') {
        return [];
    }
    const finite = `isfinite(t.${column})`;
    if (direction === 'ASC' || typeName === 'timestamp') {
        return [finite];
    }
    const notFuture = typeName === 'timestamptz' ? `t.${column} <= now()` : `t.${column} <= current_date`;
    return [finite, notFuture];
}

function helperNames(): HelperNames {
    const tag = crypto.randomBytes(6).toString('hex');
    return {
        order: `__ap_${tag}_order`,
        key: `__ap_${tag}_key`,
        tie: `__ap_${tag}_tie`,
        atCursor: `__ap_${tag}_at_cursor`,
        isLast: `__ap_${tag}_is_last`,
        tieColumn: `__ap_${tag}_tie_`,
    };
}

function buildShape({ table, orderBy, direction, primaryKey, typeName }: { table: WatchedTable; orderBy: string; direction: unknown; primaryKey: KeyColumn[]; typeName: string | null }): QueryShape {
    if (!isOrderDirection(direction)) {
        throw new Error(JSON.stringify({
            message: 'Invalid order direction',
            order_direction: direction,
        }));
    }
    const column = format.ident(orderBy);
    const withoutPrimaryKey = primaryKey.length === 0;
    const ties = withoutPrimaryKey ? ['t.tableoid', 't.ctid'] : primaryKey.map((keyColumn) => format('t.%I', keyColumn.name));
    return {
        relation: format('%I.%I', table.table_schema, table.table_name),
        column,
        ties,
        tieCasts: withoutPrimaryKey ? ['::oid', '::tid'] : primaryKey.map((keyColumn) => `::${keyColumn.type}`),
        key: withoutPrimaryKey ? 'md5(jsonb_build_array(t.tableoid, t.ctid, md5(t::text))::text)' : `md5(jsonb_build_array(${ties.join(', ')})::text)`,
        tieText: `jsonb_build_array(${ties.map((tie) => `${tie}::text`).join(', ')})::text`,
        filters: [`t.${column} IS NOT NULL`, ...valueFilters({ column, typeName, direction })],
        typeName,
        names: helperNames(),
        newer: direction === 'DESC' ? '>' : '<',
        oldestFirst: direction === 'DESC' ? 'ASC' : 'DESC',
        newestFirst: direction === 'DESC' ? 'DESC' : 'ASC',
    };
}

async function loadPrimaryKey({ client, table }: { client: Client; table: WatchedTable }): Promise<KeyColumn[]> {
    const result = await client.query<Record<string, unknown>>(format(
        'SELECT a.attname AS name, format_type(a.atttypid, a.atttypmod) AS type FROM pg_index i JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord) ON true JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum WHERE i.indrelid = to_regclass(%L) AND i.indisprimary AND k.ord <= i.indnkeyatts ORDER BY k.ord',
        format('%I.%I', table.table_schema, table.table_name),
    ));
    return result.rows.map((row) => ({ name: String(row['name']), type: String(row['type']) }));
}

async function loadTypeName({ client, table, orderBy }: { client: Client; table: WatchedTable; orderBy: string }): Promise<string | null> {
    const result = await client.query<Record<string, unknown>>(format(
        `SELECT bt.typname AS name FROM pg_attribute a JOIN pg_type ty ON ty.oid = a.atttypid JOIN pg_type bt ON bt.oid = CASE WHEN ty.typtype = 'd' THEN ty.typbasetype ELSE ty.oid END WHERE a.attrelid = to_regclass(%L) AND a.attname = %L AND NOT a.attisdropped`,
        format('%I.%I', table.table_schema, table.table_name),
        orderBy,
    ));
    const row = result.rows[0];
    return row === undefined ? null : String(row['name']);
}

async function resolveShape({ client, settings }: { client: Client; settings: TriggerSettings }): Promise<QueryShape> {
    const primaryKey = await loadPrimaryKey({ client, table: settings.table });
    const typeName = await loadTypeName({ client, table: settings.table, orderBy: settings.orderBy });
    return buildShape({ table: settings.table, orderBy: settings.orderBy, direction: settings.direction, primaryKey, typeName });
}

function fingerprint({ settings }: { settings: TriggerSettings }): string {
    return JSON.stringify([settings.table.table_schema, settings.table.table_name, settings.orderBy, settings.direction]);
}

function isStringList(value: unknown): value is string[] {
    return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function parseTieText({ raw }: { raw: unknown }): string[] {
    const parsed: unknown = JSON.parse(String(raw));
    if (!isStringList(parsed)) {
        throw new Error('Postgres New Row: could not read the key of a row.');
    }
    return parsed;
}

function isDataException(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' && error.code.startsWith('22');
}

function parseState({ raw }: { raw: unknown }): CursorState | null {
    if (typeof raw !== 'object' || raw === null) {
        return null;
    }
    const candidate: Record<string, unknown> = { ...raw };
    const { v, props, value, seen, after } = candidate;
    if (v !== 3 || typeof props !== 'string') {
        return null;
    }
    if (value !== null && typeof value !== 'string') {
        return null;
    }
    if (after !== null && !isStringList(after)) {
        return null;
    }
    if (!isStringList(seen)) {
        return null;
    }
    return { v: 3, props, value, seen, after };
}

function literalList({ values }: { values: string[] }): string {
    return values.map((value) => format.literal(value)).join(', ');
}

function afterCondition({ shape, after }: { shape: QueryShape; after: string[] }): string {
    return `(${shape.ties.join(', ')}) > (${after.map((value, index) => `${format.literal(value)}${shape.tieCasts[index] ?? ''}`).join(', ')})`;
}

function warnOverflow(): void {
    console.warn(`Postgres New Row: more than ${SEEN_KEYS_LIMIT} rows share the order value of the newest rows; from now on a row added with that same value is delivered only if it sorts after the last row delivered (by primary key, or by storage position in a table without one).`);
}

function emptyState({ props }: { props: string }): CursorState {
    return { v: 3, props, value: null, seen: [], after: null };
}

function userRow({ row, shape }: { row: Record<string, unknown>; shape: QueryShape }): Record<string, unknown> {
    const helpers = new Set(Object.values(shape.names));
    return Object.fromEntries(Object.entries(row).filter(([column]) => !helpers.has(column) && !column.startsWith(shape.names.tieColumn)));
}

async function stateAtValue({ client, shape, props, value }: { client: Client; shape: QueryShape; props: string; value: string }): Promise<CursorState> {
    const { names } = shape;
    const result = await client.query<Record<string, unknown>>(
        `SELECT ${shape.key} AS ${names.key}, ${shape.tieText} AS ${names.tie} FROM ${shape.relation} t WHERE t.${shape.column} = ${format.literal(value)} ORDER BY ${shape.ties.map((tie) => `${tie} DESC`).join(', ')} LIMIT ${SEEN_KEYS_LIMIT + 1}`,
    );
    const rows = result.rows;
    if (rows.length > SEEN_KEYS_LIMIT) {
        warnOverflow();
        return { v: 3, props, value, seen: [], after: parseTieText({ raw: rows[0][names.tie] }) };
    }
    return { v: 3, props, value, seen: rows.map((row) => String(row[names.key])), after: null };
}

async function baselineState({ client, shape, props }: { client: Client; shape: QueryShape; props: string }): Promise<CursorState> {
    const { names } = shape;
    const result = await client.query<Record<string, unknown>>(
        `SELECT to_jsonb(t.${shape.column}) #>> '{}' AS ${names.order} FROM ${shape.relation} t WHERE ${shape.filters.join(' AND ')} ORDER BY t.${shape.column} ${shape.newestFirst} LIMIT 1`,
    );
    const top = result.rows[0];
    if (top === undefined) {
        return emptyState({ props });
    }
    return stateAtValue({ client, shape, props, value: String(top[names.order]) });
}

function pad({ value, width }: { value: number; width: number }): string {
    return String(value).padStart(width, '0');
}

function workerWallClock({ instant }: { instant: Date }): string {
    const date = `${pad({ value: instant.getFullYear(), width: 4 })}-${pad({ value: instant.getMonth() + 1, width: 2 })}-${pad({ value: instant.getDate(), width: 2 })}`;
    const time = `${pad({ value: instant.getHours(), width: 2 })}:${pad({ value: instant.getMinutes(), width: 2 })}:${pad({ value: instant.getSeconds(), width: 2 })}.${pad({ value: instant.getMilliseconds(), width: 3 })}`;
    return `${date}T${time}`;
}

function legacyWindow({ shape, value }: { shape: QueryShape; value: string }): LegacyWindow {
    const millisecondIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    if (!millisecondIso.test(value)) {
        return { low: value, high: null };
    }
    const instant = new Date(Date.parse(value));
    if (shape.typeName === 'timestamptz') {
        return { low: value, high: new Date(instant.getTime() + 1).toISOString() };
    }
    if (shape.typeName === 'timestamp') {
        const low = workerWallClock({ instant });
        return { low, high: new Date(Date.parse(`${low}Z`) + 1).toISOString().slice(0, 23) };
    }
    if (shape.typeName === 'date') {
        return { low: workerWallClock({ instant }).slice(0, 10), high: null };
    }
    return { low: value, high: null };
}

async function migrateLegacyState({ client, shape, props, legacy }: { client: Client; shape: QueryShape; props: string; legacy: unknown }): Promise<CursorState> {
    if (typeof legacy !== 'string' || legacy.lastIndexOf('|') <= 0) {
        return baselineState({ client, shape, props });
    }
    const value = legacy.slice(0, legacy.lastIndexOf('|'));
    const deliveredHash = legacy.slice(legacy.lastIndexOf('|') + 1);
    if (value === 'null' || value === 'undefined') {
        return baselineState({ client, shape, props });
    }
    const window = legacyWindow({ shape, value });
    const { names } = shape;
    const range = window.high === null
        ? `t.${shape.column} = ${format.literal(window.low)}`
        : `t.${shape.column} >= ${format.literal(window.low)} AND t.${shape.column} < ${format.literal(window.high)}`;
    try {
        const result = await client.query<Record<string, unknown>>(
            `SELECT t.*, to_jsonb(t.${shape.column}) #>> '{}' AS ${names.order}, ${shape.key} AS ${names.key} FROM ${shape.relation} t WHERE ${range} ORDER BY t.${shape.column} ${shape.newestFirst}, ${shape.ties.map((tie) => `${tie} ASC`).join(', ')} LIMIT ${SEEN_KEYS_LIMIT}`,
        );
        const delivered = result.rows.find((row) => crypto.createHash('md5').update(JSON.stringify(userRow({ row, shape }))).digest('hex') === deliveredHash);
        if (delivered !== undefined) {
            return stateAtValue({ client, shape, props, value: String(delivered[names.order]) });
        }
        const fallback = shape.newer === '<' && window.high !== null ? window.high : window.low;
        return { v: 3, props, value: fallback, seen: [], after: null };
    } catch (error) {
        if (isDataException(error)) {
            return baselineState({ client, shape, props });
        }
        throw error;
    }
}

function tieClause({ shape, state, cursor }: { shape: QueryShape; state: CursorState; cursor: string }): string | null {
    const seenClause = state.seen.length > 0 ? `${shape.key} NOT IN (${literalList({ values: state.seen })})` : null;
    const afterClause = state.after === null ? null : afterCondition({ shape, after: state.after });
    const parts = [afterClause, seenClause].filter((part): part is string => part !== null);
    if (parts.length === 0) {
        return null;
    }
    return `(t.${shape.column} ${shape.newer} ${format.literal(cursor)} OR (${parts.join(' AND ')}))`;
}

function pageQuery({ shape, state }: { shape: QueryShape; state: CursorState }): string {
    const { column, key, newer, oldestFirst, newestFirst, ties, tieText, names } = shape;
    const cursor = state.value;
    const atCursor = cursor === null ? 'false' : `(t.${column} = ${format.literal(cursor)})`;
    const conditions = cursor === null ? shape.filters : [...shape.filters, `t.${column} ${newer}= ${format.literal(cursor)}`];
    const tieCondition = cursor === null ? null : tieClause({ shape, state, cursor });
    const where = tieCondition === null ? conditions : [...conditions, tieCondition];
    const tieColumns = ties.map((tie, index) => `${tie} AS ${names.tieColumn}${index}`).join(', ');
    const outerTieOrder = ties.map((_tie, index) => `page.${names.tieColumn}${index} ASC`).join(', ');
    const inner = `SELECT t.*, to_jsonb(t.${column}) #>> '{}' AS ${names.order}, ${key} AS ${names.key}, ${tieText} AS ${names.tie}, ${tieColumns}, ${atCursor} AS ${names.atCursor} FROM ${shape.relation} t WHERE ${where.join(' AND ')} ORDER BY t.${column} ${oldestFirst}, ${ties.map((tie) => `${tie} ASC`).join(', ')} LIMIT ${ROWS_PER_POLL}`;
    return `SELECT page.*, (page.${column} = first_value(page.${column}) OVER (ORDER BY page.${column} ${newestFirst})) AS ${names.isLast} FROM (${inner}) page ORDER BY page.${column} ${oldestFirst}, ${outerTieOrder}`;
}

async function nextState({ client, shape, state, page }: { client: Client; shape: QueryShape; state: CursorState; page: Record<string, unknown>[] }): Promise<CursorState> {
    const { names } = shape;
    const last = page[page.length - 1];
    const tiedKeys = page.filter((row) => row[names.isLast] === true).map((row) => String(row[names.key]));
    if (last[names.atCursor] !== true) {
        return { v: 3, props: state.props, value: String(last[names.order]), seen: tiedKeys, after: null };
    }
    const lastTie = parseTieText({ raw: last[names.tie] });
    if (state.after !== null) {
        return { ...state, after: lastTie };
    }
    const seen = [...state.seen, ...tiedKeys];
    if (seen.length <= SEEN_KEYS_LIMIT) {
        return { ...state, seen };
    }
    warnOverflow();
    const remaining = await client.query<Record<string, unknown>>(
        `SELECT ${shape.key} AS ${names.key} FROM ${shape.relation} t WHERE t.${shape.column} = ${format.literal(String(state.value))} AND ${afterCondition({ shape, after: lastTie })} AND ${shape.key} IN (${literalList({ values: state.seen })})`,
    );
    return { ...state, seen: remaining.rows.map((row) => String(row[names.key])), after: lastTie };
}

async function enable({ client, store, settings, isRepublish }: { client: Client; store: CursorStore; settings: TriggerSettings; isRepublish: boolean }): Promise<void> {
    const props = fingerprint({ settings });
    const existing = parseState({ raw: await store.get<unknown>(CURSOR_STORE_KEY) });
    if (isRepublish && existing !== null && existing.props === props) {
        return;
    }
    const shape = await resolveShape({ client, settings });
    const legacy = await store.get<unknown>(LEGACY_STORE_KEY);
    const state = isRepublish && existing === null && legacy !== null
        ? await migrateLegacyState({ client, shape, props, legacy })
        : await baselineState({ client, shape, props });
    await store.put(CURSOR_STORE_KEY, state);
    await store.delete(LEGACY_STORE_KEY);
}

async function poll({ client, store, settings }: { client: Client; store: CursorStore; settings: TriggerSettings }): Promise<Record<string, unknown>[]> {
    const props = fingerprint({ settings });
    const shape = await resolveShape({ client, settings });
    const existing = parseState({ raw: await store.get<unknown>(CURSOR_STORE_KEY) });
    if (existing !== null && existing.props !== props) {
        await store.put(CURSOR_STORE_KEY, await baselineState({ client, shape, props }));
        return [];
    }
    const legacy = existing === null ? await store.get<unknown>(LEGACY_STORE_KEY) : null;
    const state = existing ?? (legacy !== null
        ? await migrateLegacyState({ client, shape, props, legacy })
        : emptyState({ props }));
    const result = await client.query<Record<string, unknown>>(pageQuery({ shape, state }));
    const page = result.rows;
    if (page.length === 0) {
        if (existing === null) {
            await store.put(CURSOR_STORE_KEY, state);
            await store.delete(LEGACY_STORE_KEY);
        }
        return [];
    }
    if (page.length >= ROWS_PER_POLL) {
        console.warn(`Postgres New Row: delivering the oldest ${ROWS_PER_POLL} new rows; the rest follow on the next checks.`);
    }
    await store.put(CURSOR_STORE_KEY, await nextState({ client, shape, state, page }));
    if (existing === null) {
        await store.delete(LEGACY_STORE_KEY);
    }
    return page.map((row) => userRow({ row, shape })).reverse();
}

async function sample({ client, settings }: { client: Client; settings: TriggerSettings }): Promise<Record<string, unknown>[]> {
    const shape = await resolveShape({ client, settings });
    const result = await client.query<Record<string, unknown>>(
        `SELECT t.* FROM ${shape.relation} t WHERE ${shape.filters.join(' AND ')} ORDER BY t.${shape.column} ${shape.newestFirst}, ${shape.ties.map((tie) => `${tie} DESC`).join(', ')} LIMIT 5`,
    );
    return result.rows;
}

const ROWS_PER_POLL = 500;
const SEEN_KEYS_LIMIT = 2000;
const CURSOR_STORE_KEY = 'new_row_cursor';
const LEGACY_STORE_KEY = 'lastItem';

export const newRowPoller = {
    enable,
    poll,
    sample,
};

type KeyColumn = {
    name: string;
    type: string;
};

type HelperNames = {
    order: string;
    key: string;
    tie: string;
    atCursor: string;
    isLast: string;
    tieColumn: string;
};

type QueryShape = {
    relation: string;
    column: string;
    ties: string[];
    tieCasts: string[];
    key: string;
    tieText: string;
    filters: string[];
    typeName: string | null;
    names: HelperNames;
    newer: '>' | '<';
    oldestFirst: OrderDirection;
    newestFirst: OrderDirection;
};

type LegacyWindow = {
    low: string;
    high: string | null;
};

type CursorState = {
    v: 3;
    props: string;
    value: string | null;
    seen: string[];
    after: string[] | null;
};

type CursorStore = {
    get<T>(key: string): Promise<T | null>;
    put<T>(key: string, value: T): Promise<T>;
    delete(key: string): Promise<void>;
};

export type OrderDirection = 'ASC' | 'DESC';

export type WatchedTable = {
    table_schema: string;
    table_name: string;
};

export type TriggerSettings = {
    table: WatchedTable;
    orderBy: string;
    direction: unknown;
};
