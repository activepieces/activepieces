import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { kleapAuth } from '../auth';
import { JsonObject, kleapRequest, parseJsonInput, requireWhere, resolveAppId } from '../common/client';
import { appDropdown, tableDropdown } from '../common/props';
import { buildWhere, collectValues, columnDropdown, columnValuesProp, fetchColumns, whereProps } from '../common/db-props';

const tablePath = (appId: string, table: string) =>
  `/apps/${appId}/database/tables/${encodeURIComponent(String(table).trim())}/rows`;

export const getDatabaseSchema = createAction({
  auth: kleapAuth,
  name: 'get_database_schema',
  displayName: 'Get Database Schema',
  description:
    'Lists the tables of the app\'s Kleap Database with their columns and row counts. Apps without a database answer DATABASE_NOT_PROVISIONED.',
  props: { app_id: appDropdown() },
  async run(context) {
    const appId = await resolveAppId(context.auth, context.propsValue.app_id);
    return kleapRequest(context.auth, HttpMethod.GET, `/apps/${appId}/database`);
  },
});

export const findRows = createAction({
  auth: kleapAuth,
  name: 'find_rows',
  displayName: 'Find Rows',
  description:
    'Reads rows from a table, optionally only those where a column equals a value, sorted and paginated. At most 5 MB per call: check has_more / truncated and page with Offset.',
  props: {
    app_id: appDropdown(),
    table: tableDropdown(),
    ...whereProps(false),
    order_by: columnDropdown({ displayName: 'Sort By', description: 'Optional column to sort on, e.g. created_at.' }),
    order: Property.StaticDropdown({
      displayName: 'Order',
      required: false,
      defaultValue: 'desc',
      options: {
        options: [
          { label: 'Newest / largest first', value: 'desc' },
          { label: 'Oldest / smallest first', value: 'asc' },
        ],
      },
    }),
    limit: Property.Number({ displayName: 'Limit', description: 'Up to 500.', required: false, defaultValue: 100 }),
    offset: Property.Number({ displayName: 'Offset', required: false, defaultValue: 0 }),
  },
  async run(context) {
    const p = context.propsValue;
    const appId = await resolveAppId(context.auth, p.app_id);
    const needsColumns = !!p.where_column;
    const columns = needsColumns ? await fetchColumns(context.auth, appId, p.table) : [];
    const where = buildWhere(p, columns);
    const orderBy = typeof p.order_by === 'string' ? p.order_by.trim() : '';
    return kleapRequest(context.auth, HttpMethod.GET, tablePath(appId, p.table), {
      query: {
        limit: Math.min(500, Math.max(1, Number(p.limit ?? 100))),
        offset: Number(p.offset ?? 0) || undefined,
        order_by: orderBy || undefined,
        order: orderBy ? p.order || 'desc' : undefined,
        where: Object.keys(where).length ? JSON.stringify(where) : undefined,
      },
    });
  },
});

export const insertRows = createAction({
  auth: kleapAuth,
  name: 'insert_rows',
  displayName: 'Insert Row',
  description: 'Adds a row to a table: one field per column. Returns the inserted row (with its id).',
  props: {
    app_id: appDropdown(),
    table: tableDropdown(),
    values: columnValuesProp('insert'),
    rows_advanced: Property.Json({
      displayName: 'More Rows (Advanced, Optional)',
      description: 'Only to insert several rows at once: a JSON array of objects, e.g. [{"email": "a@b.co"}]. 500 max.',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const appId = await resolveAppId(context.auth, p.app_id);
    const columns = await fetchColumns(context.auth, appId, p.table);
    const rows: JsonObject[] = [];
    const row = collectValues(p.values, columns);
    if (Object.keys(row).length) rows.push(row);
    const extra = parseJsonInput<JsonObject | JsonObject[]>(p.rows_advanced, 'More Rows');
    if (extra) rows.push(...(Array.isArray(extra) ? extra : [extra]));
    if (!rows.length) throw new Error('Fill at least one column.');
    if (rows.length > 500) throw new Error(`At most 500 rows per call (got ${rows.length}).`);
    return kleapRequest(context.auth, HttpMethod.POST, tablePath(appId, p.table), { body: { rows } });
  },
});

export const updateRows = createAction({
  auth: kleapAuth,
  name: 'update_rows',
  displayName: 'Update Rows',
  description: 'Changes the rows where a column equals a value (e.g. id = 42). Fill only the columns to change.',
  props: {
    app_id: appDropdown(),
    table: tableDropdown(),
    ...whereProps(true),
    values: columnValuesProp('set'),
  },
  async run(context) {
    const p = context.propsValue;
    const appId = await resolveAppId(context.auth, p.app_id);
    const columns = await fetchColumns(context.auth, appId, p.table);
    const where = requireWhere(buildWhere(p, columns));
    const set = collectValues(p.values, columns);
    if (!Object.keys(set).length) throw new Error('Fill at least one column to change in "New Values".');
    return kleapRequest(context.auth, HttpMethod.PATCH, tablePath(appId, p.table), { body: { where, set } });
  },
});

export const deleteRows = createAction({
  auth: kleapAuth,
  name: 'delete_rows',
  displayName: 'Delete Rows',
  description: 'Deletes the rows where a column equals a value (e.g. id = 42). Returns how many were deleted.',
  props: {
    app_id: appDropdown(),
    table: tableDropdown(),
    ...whereProps(true),
  },
  async run(context) {
    const p = context.propsValue;
    const appId = await resolveAppId(context.auth, p.app_id);
    const columns = await fetchColumns(context.auth, appId, p.table);
    const where = requireWhere(buildWhere(p, columns));
    return kleapRequest(context.auth, HttpMethod.DELETE, tablePath(appId, p.table), { body: { where } });
  },
});

export const runSql = createAction({
  auth: kleapAuth,
  name: 'run_sql',
  displayName: 'Run SQL',
  description:
    'Runs SQL on the app\'s Postgres database with owner rights (needs the database:write scope, even for a SELECT). Accepts a query, INSERT/UPDATE/DELETE/MERGE or DDL; not EXPLAIN, SHOW, COPY or CALL. Results are capped at 500 rows / 5 MB (truncated: true). Use $1, $2… placeholders with Parameters.',
  props: {
    app_id: appDropdown(),
    sql: Property.LongText({
      displayName: 'SQL',
      description: 'e.g. SELECT * FROM leads WHERE status = $1 ORDER BY created_at DESC LIMIT 20',
      required: true,
    }),
    params: Property.Array({
      displayName: 'Parameters',
      description: 'Optional values for $1, $2… in order (one value per line).',
      required: false,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const appId = await resolveAppId(context.auth, p.app_id);
    const sql = (p.sql ?? '').trim();
    if (!sql) throw new Error('The SQL is empty.');
    const params = Array.isArray(p.params) ? p.params : parseJsonInput<unknown>(p.params, 'Parameters');
    if (params !== undefined && !Array.isArray(params)) throw new Error('Parameters must be a list of values.');
    const body: JsonObject = { sql };
    if (params?.length) body['params'] = params;
    return kleapRequest(context.auth, HttpMethod.POST, `/apps/${appId}/database/query`, { body, timeoutMs: 120_000 });
  },
});
