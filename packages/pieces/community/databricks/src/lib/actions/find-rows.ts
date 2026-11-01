import { createAction, Property } from '@activepieces/pieces-framework';

import { databricksAuth } from '../auth';
import { databricksApi } from '../common/api';
import { databricksProps } from '../common/props';
import { databricksUtils } from '../common/utils';
import { queryResultOutputSchema } from '../output-schemas';

export const findRowsAction = createAction({
  auth: databricksAuth,
  name: 'find_rows',
  classification: 'SEARCH',
  displayName: 'Find Rows',
  description:
    'Finds rows in a Unity Catalog table where a column matches a value.',
  audience: 'both',
  aiMetadata: {
    description:
      'Return rows from a Databricks Unity Catalog table whose column equals a value, or the first rows of the table when no filter is set. For joins, aggregates or other conditions use Run SQL Query. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    warehouseId: databricksProps.warehouseId({ required: true }),
    catalogName: databricksProps.catalogName({ required: true }),
    schemaName: databricksProps.schemaName({ required: true }),
    tableName: databricksProps.tableName({ required: true }),
    columnName: databricksProps.columnName({
      required: false,
      displayName: 'Filter Column',
      description:
        'Only return rows whose value in this column equals Filter Value. Leave empty to return the first rows of the table.',
    }),
    filterValue: Property.ShortText({
      displayName: 'Filter Value',
      description:
        'The value to match in the filter column, e.g. 1042 or jane@example.com.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description:
        'Maximum number of rows to return (1-10000). Defaults to 100.',
      required: false,
      defaultValue: 100,
    }),
  },
  outputSchema: queryResultOutputSchema,
  async run(context) {
    const {
      warehouseId,
      catalogName,
      schemaName,
      tableName,
      columnName,
      filterValue,
      limit,
    } = context.propsValue;
    const rowLimit = Math.min(Math.max(Math.floor(limit ?? 100), 1), 10000);
    const from = `SELECT * FROM ${databricksUtils.tableRef({
      catalogName,
      schemaName,
      tableName,
    })}`;
    if (!columnName) {
      return await databricksApi.executeStatement({
        auth: context.auth,
        warehouseId,
        statement: `${from} LIMIT ${rowLimit}`,
      });
    }
    if (filterValue === undefined || filterValue === '') {
      throw new Error(
        'Enter a Filter Value, or clear Filter Column to return the first rows.'
      );
    }
    const table = await databricksApi.getTable({
      auth: context.auth,
      catalogName,
      schemaName,
      tableName,
    });
    const column = databricksUtils.findColumn({
      columns: table.columns ?? [],
      name: columnName,
    });
    return await databricksApi.executeStatement({
      auth: context.auth,
      warehouseId,
      statement: `${from} WHERE ${databricksUtils.quoteIdentifier({
        name: column.name,
      })} = ${databricksUtils.convertToColumnType({
        column,
        expression: ':value',
      })} LIMIT ${rowLimit}`,
      parameters: [{ name: 'value', value: filterValue }],
    });
  },
});
