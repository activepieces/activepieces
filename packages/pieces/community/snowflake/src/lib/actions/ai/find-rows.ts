import { createAction, Property } from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../../auth';
import { toAuthValue, withSnowflake } from '../../common';
import {
  aiProps,
  READ_DEFAULT_LIMIT,
  READ_MAX_LIMIT,
} from '../../common/ai-props';
import { findRowsOutputSchema } from '../../common/output-schemas';
import {
  boundedInteger,
  buildOrderBy,
  buildWhere,
  identifier,
  parseStringList,
  qualifiedName,
} from '../../common/sql';

export const findRowsAction = createAction({
  name: 'find_rows',
  classification: 'SEARCH',
  displayName: 'Find Rows',
  description:
    'Find rows in a table using structured filters, sort and paging.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns rows of a table that match all given filters (column, operator, value), optionally sorted and limited to chosen columns, with offset paging (hasMore, nextOffset). Values are sent as bound parameters. Use Count Rows for totals and Get Row by Key for one row. Safe to retry.',
    idempotent: true,
  },
  outputSchema: findRowsOutputSchema,
  auth: snowflakeAuth,
  props: {
    table: aiProps.table(),
    filters: aiProps.filters(false),
    columns: Property.Array({
      displayName: 'Columns',
      description: 'Columns to return. Leave empty for all columns.',
      required: false,
    }),
    sort: Property.Array({
      displayName: 'Sort',
      description:
        'Sort order; each entry has a column and a direction (ASC or DESC). Set a sort when paging so pages are stable.',
      required: false,
      properties: {
        column: Property.ShortText({ displayName: 'Column', required: true }),
        direction: Property.StaticDropdown({
          displayName: 'Direction',
          required: false,
          defaultValue: 'ASC',
          options: {
            options: [
              { label: 'ASC', value: 'ASC' },
              { label: 'DESC', value: 'DESC' },
            ],
          },
        }),
      },
    }),
    limit: aiProps.limit(READ_DEFAULT_LIMIT, READ_MAX_LIMIT),
    offset: Property.Number({
      displayName: 'Offset',
      description:
        'Number of rows to skip, for paging. Use nextOffset from the previous call.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const { table, filters, columns, sort, limit, offset } = context.propsValue;
    const max = boundedInteger({
      value: limit,
      defaultValue: READ_DEFAULT_LIMIT,
      min: 1,
      max: READ_MAX_LIMIT,
      label: 'Limit',
    });
    const skip = boundedInteger({
      value: offset,
      defaultValue: 0,
      min: 0,
      max: 10000000,
      label: 'Offset',
    });
    const where = buildWhere(filters);
    const columnNames = parseStringList({ value: columns, label: 'Columns' });
    const select =
      columnNames.length > 0
        ? columnNames
            .map((column) => identifier({ name: column, label: 'Column' }))
            .join(', ')
        : '*';
    const sql = `SELECT ${select} FROM ${qualifiedName({
      value: table,
      label: 'Table',
    })}${where.clause}${buildOrderBy(sort)} LIMIT ${max + 1} OFFSET ${skip}`;
    const result = await withSnowflake({
      auth: toAuthValue(context.auth),
      fn: (session) =>
        session.query({ sql, binds: where.binds, maxRows: max + 1 }),
    });
    const hasMore = result.rows.length > max;
    const rows = result.rows.slice(0, max);
    return {
      rows,
      rowCount: rows.length,
      hasMore,
      nextOffset: hasMore ? skip + max : null,
    };
  },
});
