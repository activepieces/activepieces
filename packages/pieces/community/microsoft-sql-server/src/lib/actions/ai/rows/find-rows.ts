import { createAction, Property } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../../../auth';
import { mssqlCommon } from '../../../common';
import { mssqlAi, mssqlAiProps } from '../../../common/ai';
import { microsoftSqlServerFindRowsOutputSchema } from '../../../output-schemas';

export const findRowsAi = createAction({
  auth: mssqlAuth,
  name: 'microsoft_sql_server_find_rows',
  outputSchema: microsoftSqlServerFindRowsOutputSchema,
  displayName: 'Find Rows',
  description: 'Finds rows in a table using structured filters, sort and paging.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Returns rows of a table or view matching all given filters (column, operator, value), optionally limited to chosen columns and sorted, with offset paging (has_more, next_offset). Values are sent as bound parameters; decimal, money and date/time values come back as exact strings. Without a sort, rows are ordered by the primary key. Use Count Rows for totals and Get Row by Key for one row. Column names come from Describe Table. Read-only.',
    idempotent: true,
  },
  props: {
    schema: mssqlAiProps.schema,
    table: mssqlAiProps.table,
    filters: mssqlAiProps.filters({ required: false }),
    columns: Property.Array({
      displayName: 'Columns',
      description: 'Columns to return. Leave empty for all columns.',
      required: false,
    }),
    sort: Property.Array({
      displayName: 'Sort',
      description: 'Sort order; each entry has a column and a direction (ASC or DESC). Leave empty to sort by the primary key.',
      required: false,
      properties: {
        column: Property.ShortText({ displayName: 'Column', required: true }),
        direction: Property.StaticDropdown({
          displayName: 'Direction',
          required: false,
          defaultValue: 'ASC',
          options: { options: [{ label: 'ASC', value: 'ASC' }, { label: 'DESC', value: 'DESC' }] },
        }),
      },
    }),
    limit: mssqlAiProps.limit,
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of rows to skip, for paging. Use next_offset from the previous call with the same filters and sort.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const { schema, table, filters, columns, sort, limit, offset } = context.propsValue;
    const max = mssqlAi.boundedInteger({ value: limit, defaultValue: mssqlAi.READ_DEFAULT_LIMIT, min: 1, max: mssqlAi.READ_MAX_LIMIT, label: 'Limit' });
    const skip = mssqlAi.boundedInteger({ value: offset, defaultValue: 0, min: 0, max: Number.MAX_SAFE_INTEGER, label: 'Offset' });
    const where = mssqlAi.buildWhere({ filters });
    const sortBy = mssqlAi.buildOrderBy({ sort });
    const found = await mssqlAi.withPool({
      auth: context.auth,
      fn: async (pool) => {
        const target = await mssqlAi.resolveObject({ pool, schema, name: table, kinds: mssqlAi.TABLE_KINDS, label: 'Table' });
        const meta = await mssqlCommon.getTableMeta({ pool, table: target });
        const select = mssqlAi.projection({ columns: meta.columns, selected: (columns ?? []).map(String) });
        const keyOrder = meta.keyColumns.map((column) => `${mssqlCommon.quoteId(column)} ASC`).join(', ');
        const orderBy = sortBy || keyOrder || '(SELECT NULL)';
        const result = await mssqlAi
          .bind({ request: pool.request(), params: { ...where.params, ap_offset: skip, ap_fetch: max + 1 } })
          .query<Record<string, unknown>>(
            `SELECT ${select} FROM ${mssqlCommon.quoteTable(target)}${where.sql} ORDER BY ${orderBy} OFFSET @ap_offset ROWS FETCH NEXT @ap_fetch ROWS ONLY`
          );
        return result.recordset;
      },
    });
    const hasMore = found.length > max;
    const rows = found.slice(0, max);
    return { rows, count: rows.length, has_more: hasMore, next_offset: hasMore ? skip + max : null };
  },
});
