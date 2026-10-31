import { createAction, Property } from '@activepieces/pieces-framework';
import format from 'pg-format';
import { postgresAuth } from '../../../auth';
import { postgresAi, postgresAiProps } from '../../../ai-common';
import { postgresFindRowsOutputSchema } from '../../../output-schemas';

export const findRowsAi = createAction({
  auth: postgresAuth,
  name: 'postgres_find_rows',
  outputSchema: postgresFindRowsOutputSchema,
  displayName: 'Find Rows',
  description: 'Finds rows in a table using structured filters, sort and paging.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Returns rows of a table or view matching all given filters (column, operator, value), optionally limited to chosen columns and sorted, with offset paging (hasMore, nextOffset). Values are sent as bound parameters. Use Count Rows for totals and Get Row by Key for one row by its key. Column names come from Describe Table. Read-only.',
    idempotent: true,
  },
  props: {
    table: postgresAiProps.table,
    filters: postgresAiProps.filters({ required: false }),
    columns: Property.Array({
      displayName: 'Columns',
      description: 'Columns to return. Leave empty for all columns.',
      required: false,
    }),
    sort: Property.Array({
      displayName: 'Sort',
      description: 'Sort order; each entry has a column and a direction (ASC or DESC). Set a sort when paging so pages are stable.',
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
    limit: postgresAiProps.limit,
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of rows to skip, for paging. Use nextOffset from the previous call with the same filters and sort.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const { table, filters, columns, sort, limit, offset } = context.propsValue;
    const max = postgresAi.boundedInteger({ value: limit, defaultValue: postgresAi.READ_DEFAULT_LIMIT, min: 1, max: postgresAi.READ_MAX_LIMIT, label: 'Limit' });
    const skip = postgresAi.boundedInteger({ value: offset, defaultValue: 0, min: 0, max: Number.MAX_SAFE_INTEGER, label: 'Offset' });
    const where = postgresAi.buildWhere({ filters, startAt: 0 });
    const columnList = (columns ?? []).map((column) => format.ident(String(column)));
    const select = columnList.length > 0 ? columnList.join(', ') : '*';
    const sql = `SELECT ${select} FROM ${postgresAi.quoteName({ name: table })}${where.sql}${postgresAi.buildOrderBy({ sort })} LIMIT ${max + 1} OFFSET ${skip}`;
    const result = await postgresAi.withClient({
      auth: context.auth,
      fn: (client) => client.query(sql, where.values),
    });
    const hasMore = result.rows.length > max;
    const rows = result.rows.slice(0, max);
    return { rows, count: rows.length, hasMore, nextOffset: hasMore ? skip + max : null };
  },
});
