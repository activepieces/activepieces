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
    if (direction === 'ASC') {
        return [finite];
    }
    const notFuture = {
        timestamptz: `t.${column} <= now()`,
        timestamp: `t.${column} <= localtimestamp`,
        date: `t.${column} <= current_date`,
    }[typeName];
    return [finite, notFuture];
}

function buildShape({ table, orderBy, direction, primaryKey, typeName }: { table: WatchedTable; orderBy: string; direction: unknown; primaryKey: string[]; typeName: string | null }): QueryShape {
    if (!isOrderDirection(direction)) {
        throw new Error(JSON.stringify({
            message: 'Invalid order direction',
            order_direction: direction,
        }));
    }
    const column = format.ident(orderBy);
    const contentKeyed = primaryKey.length === 0;
    const ties = contentKeyed ? ['t.__ap_ctid'] : primaryKey.map((name) => format('t.%I', name));
    const keyParts = contentKeyed ? ['t.__ap_row_hash', 't.__ap_row_ordinal'] : ties;
    return {
        relation: format('%I.%I', table.table_schema, table.table_name),
        contentKeyed,
        sampleTies: contentKeyed ? ['t.ctid'] : ties,
        column,
        ties,
        tieCast: contentKeyed ? '::tid' : '',
        key: contentKeyed ? `jsonb_build_array(${keyParts.join(', ')})::text` : `md5(jsonb_build_array(${keyParts.join(', ')})::text)`,
        tieText: `jsonb_build_array(${ties.map((tie) => `to_jsonb(${tie}) #>> '{}'`).join(', ')})::text`,
        filters: [`t.${column} IS NOT NULL`, ...valueFilters({ column, typeName, direction })],
        typeName,
        newer: direction === 'DESC' ? '>' : '<',
        oldestFirst: direction === 'DESC' ? 'ASC' : 'DESC',
        newestFirst: direction === 'DESC' ? 'DESC' : 'ASC',
    };
}

async function loadPrimaryKey({ client, table }: { client: Client; table: WatchedTable }): Promise<string[]> {
    const result = await client.query<Record<string, unknown>>(format(
        'SELECT a.attname AS name FROM pg_index i JOIN LATERAL unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord) ON true JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = k.attnum WHERE i.indrelid = to_regclass(%L) AND i.indisprimary AND k.ord <= i.indnkeyatts ORDER BY k.ord',
        format('%I.%I', table.table_schema, table.table_name),
    ));
    return result.rows.map((row) => String(row['name']));
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
    if (v !== 2 || typeof props !== 'string') {
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
    return { v: 2, props, value, seen, after };
}

function fromClause({ shape, range, keyed }: { shape: QueryShape; range: string[]; keyed: string[] }): string {
    if (!shape.contentKeyed) {
        return `${shape.relation} t WHERE ${[...range, ...keyed].join(' AND ')}`;
    }
    const inner = `(SELECT t.*, t.ctid AS __ap_ctid, md5(t::text) AS __ap_row_hash, row_number() OVER (PARTITION BY md5(t::text) ORDER BY t.ctid) AS __ap_row_ordinal FROM ${shape.relation} t WHERE ${range.join(' AND ')}) t`;
    return keyed.length === 0 ? inner : `${inner} WHERE ${keyed.join(' AND ')}`;
}

function literalList({ values }: { values: string[] }): string {
    return values.map((value) => format.literal(value)).join(', ');
}

function afterCondition({ shape, after }: { shape: QueryShape; after: string[] }): string {
    return `(${shape.ties.join(', ')}) > (${after.map((value) => `${format.literal(value)}${shape.tieCast}`).join(', ')})`;
}

function warnOverflow(): void {
    console.warn(`Postgres New Row: more than ${SEEN_KEYS_LIMIT} rows share the order value of the newest rows; from now on a row added with that same value is delivered only if it sorts after the last row delivered (by primary key, or by storage position in a table without one).`);
}

function emptyState({ props }: { props: string }): CursorState {
    return { v: 2, props, value: null, seen: [], after: null };
}

async function stateAtValue({ client, shape, props, value }: { client: Client; shape: QueryShape; props: string; value: string }): Promise<CursorState> {
    const result = await client.query<Record<string, unknown>>(
        `SELECT ${shape.key} AS __ap_key, ${shape.tieText} AS __ap_tie FROM ${fromClause({ shape, range: [`t.${shape.column} = ${format.literal(value)}`], keyed: [] })} ORDER BY ${shape.ties.map((tie) => `${tie} DESC`).join(', ')} LIMIT ${SEEN_KEYS_LIMIT + 1}`,
    );
    const rows = result.rows;
    if (rows.length > SEEN_KEYS_LIMIT) {
        warnOverflow();
        return { v: 2, props, value, seen: [], after: parseTieText({ raw: rows[0]['__ap_tie'] }) };
    }
    return { v: 2, props, value, seen: rows.map((row) => String(row['__ap_key'])), after: null };
}

async function baselineState({ client, shape, props }: { client: Client; shape: QueryShape; props: string }): Promise<CursorState> {
    const result = await client.query<Record<string, unknown>>(
        `SELECT to_jsonb(t.${shape.column}) #>> '{}' AS __ap_order FROM ${shape.relation} t WHERE ${shape.filters.join(' AND ')} ORDER BY t.${shape.column} ${shape.newestFirst} LIMIT 1`,
    );
    const top = result.rows[0];
    if (top === undefined) {
        return emptyState({ props });
    }
    return stateAtValue({ client, shape, props, value: String(top['__ap_order']) });
}

async function legacyValue({ client, shape, value }: { client: Client; shape: QueryShape; value: string }): Promise<string> {
    const millisecondIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    if ((shape.typeName !== 'timestamp' && shape.typeName !== 'timestamptz') || !millisecondIso.test(value)) {
        return value;
    }
    const windowEnd = new Date(Date.parse(value) + 1).toISOString();
    const result = await client.query<Record<string, unknown>>(
        `SELECT to_jsonb(t.${shape.column}) #>> '{}' AS __ap_order FROM ${shape.relation} t WHERE t.${shape.column} >= ${format.literal(value)} AND t.${shape.column} < ${format.literal(windowEnd)} ORDER BY t.${shape.column} ${shape.newestFirst} LIMIT 1`,
    );
    const exact = result.rows[0];
    return exact === undefined ? value : String(exact['__ap_order']);
}

async function migrateLegacyState({ client, shape, props, legacy }: { client: Client; shape: QueryShape; props: string; legacy: unknown }): Promise<CursorState> {
    if (typeof legacy !== 'string' || legacy.lastIndexOf('|') <= 0) {
        return baselineState({ client, shape, props });
    }
    const value = legacy.slice(0, legacy.lastIndexOf('|'));
    if (value === 'null' || value === 'undefined') {
        return baselineState({ client, shape, props });
    }
    try {
        return await stateAtValue({ client, shape, props, value: await legacyValue({ client, shape, value }) });
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
    const { column, key, newer, oldestFirst, newestFirst, ties, tieText } = shape;
    const cursor = state.value;
    const atCursor = cursor === null ? 'false' : `(t.${column} = ${format.literal(cursor)})`;
    const range = cursor === null ? shape.filters : [...shape.filters, `t.${column} ${newer}= ${format.literal(cursor)}`];
    const tieCondition = cursor === null ? null : tieClause({ shape, state, cursor });
    const keyed = tieCondition === null ? [] : [tieCondition];
    const tieColumns = ties.map((tie, index) => `${tie} AS __ap_tie_${index}`).join(', ');
    const outerTieOrder = ties.map((_tie, index) => `page.__ap_tie_${index} ASC`).join(', ');
    return `SELECT page.*, (page.${column} = first_value(page.${column}) OVER (ORDER BY page.${column} ${newestFirst})) AS __ap_is_last FROM (SELECT t.*, to_jsonb(t.${column}) #>> '{}' AS __ap_order, ${key} AS __ap_key, ${tieText} AS __ap_tie, ${tieColumns}, ${atCursor} AS __ap_at_cursor FROM ${fromClause({ shape, range, keyed })} ORDER BY t.${column} ${oldestFirst}, ${ties.map((tie) => `${tie} ASC`).join(', ')} LIMIT ${ROWS_PER_POLL}) page ORDER BY page.${column} ${oldestFirst}, ${outerTieOrder}`;
}

async function nextState({ client, shape, state, page }: { client: Client; shape: QueryShape; state: CursorState; page: Record<string, unknown>[] }): Promise<CursorState> {
    const last = page[page.length - 1];
    const tiedKeys = page.filter((row) => row['__ap_is_last'] === true).map((row) => String(row['__ap_key']));
    if (last['__ap_at_cursor'] !== true) {
        return { v: 2, props: state.props, value: String(last['__ap_order']), seen: tiedKeys, after: null };
    }
    const lastTie = parseTieText({ raw: last['__ap_tie'] });
    if (state.after !== null) {
        return { ...state, after: lastTie };
    }
    const seen = [...state.seen, ...tiedKeys];
    if (seen.length <= SEEN_KEYS_LIMIT) {
        return { ...state, seen };
    }
    warnOverflow();
    const remaining = await client.query<Record<string, unknown>>(
        `SELECT ${shape.key} AS __ap_key FROM ${fromClause({ shape, range: [`t.${shape.column} = ${format.literal(String(state.value))}`], keyed: [afterCondition({ shape, after: lastTie }), `${shape.key} IN (${literalList({ values: state.seen })})`] })}`,
    );
    return { ...state, seen: remaining.rows.map((row) => String(row['__ap_key'])), after: lastTie };
}

function stripHelpers({ row }: { row: Record<string, unknown> }): Record<string, unknown> {
    return Object.fromEntries(Object.entries(row).filter(([column]) => !column.startsWith(HELPER_PREFIX)));
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

async function disable({ store, isRepublish }: { store: CursorStore; isRepublish: boolean }): Promise<void> {
    if (isRepublish) {
        return;
    }
    await store.delete(CURSOR_STORE_KEY);
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
    return page.map((row) => stripHelpers({ row })).reverse();
}

async function sample({ client, settings }: { client: Client; settings: TriggerSettings }): Promise<Record<string, unknown>[]> {
    const shape = await resolveShape({ client, settings });
    const result = await client.query<Record<string, unknown>>(
        `SELECT t.* FROM ${shape.relation} t WHERE ${shape.filters.join(' AND ')} ORDER BY t.${shape.column} ${shape.newestFirst}, ${shape.sampleTies.map((tie) => `${tie} DESC`).join(', ')} LIMIT 5`,
    );
    return result.rows;
}

const ROWS_PER_POLL = 500;
const SEEN_KEYS_LIMIT = 2000;
const CURSOR_STORE_KEY = 'new_row_cursor';
const LEGACY_STORE_KEY = 'lastItem';
const HELPER_PREFIX = '__ap_';

type QueryShape = {
    relation: string;
    contentKeyed: boolean;
    sampleTies: string[];
    column: string;
    ties: string[];
    tieCast: string;
    key: string;
    tieText: string;
    filters: string[];
    typeName: string | null;
    newer: '>' | '<';
    oldestFirst: OrderDirection;
    newestFirst: OrderDirection;
};

type CursorState = {
    v: 2;
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

export const newRowPoller = {
    enable,
    disable,
    poll,
    sample,
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
