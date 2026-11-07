import { createAction, Property } from '@activepieces/pieces-framework';

import { databricksAuth } from '../auth';
import { databricksApi } from '../common/api';
import { databricksProps } from '../common/props';
import { databricksUtils } from '../common/utils';
import { updateResultOutputSchema } from '../output-schemas';

export const updateRowsAction = createAction({
  auth: databricksAuth,
  name: 'update_rows',
  classification: 'WRITE',
  displayName: 'Update Rows',
  description:
    'Updates the rows of a Unity Catalog table where a column matches a value.',
  audience: 'both',
  aiMetadata: {
    description:
      'Update every row of a Databricks Unity Catalog table whose match column equals the given value, setting only the columns you fill in. Use Upsert Row instead when the row may not exist yet. Setting the same values again is safe to retry.',
    idempotent: true,
  },
  props: {
    warehouseId: databricksProps.warehouseId({ required: true }),
    catalogName: databricksProps.catalogName({ required: true }),
    schemaName: databricksProps.schemaName({ required: true }),
    tableName: databricksProps.tableName({ required: true }),
    columnName: databricksProps.columnName({
      required: true,
      displayName: 'Match Column',
      description:
        'Rows whose value in this column equals Match Value are updated.',
    }),
    matchValue: Property.ShortText({
      displayName: 'Match Value',
      description:
        'The value to look for in the match column, e.g. 1042 or jane@example.com.',
      required: true,
    }),
    rowFields: databricksProps.rowFields({
      required: true,
      displayName: 'New Values',
      description:
        'Fill in only the columns to change. Empty fields are left as they are.',
    }),
  },
  outputSchema: updateResultOutputSchema,
  async run(context) {
    const {
      warehouseId,
      catalogName,
      schemaName,
      tableName,
      columnName,
      matchValue,
      rowFields,
    } = context.propsValue;
    const table = await databricksApi.getTable({
      auth: context.auth,
      catalogName,
      schemaName,
      tableName,
    });
    const columns = table.columns ?? [];
    const values = databricksUtils.compactRow({ row: rowFields ?? {} });
    const changed = columns.filter(
      (column) => values[column.name] !== undefined
    );
    if (changed.length === 0) {
      throw new Error('Fill in at least one column to update.');
    }
    const assignments = changed.map((column, index) => {
      const name = databricksUtils.quoteIdentifier({ name: column.name });
      return `${name} = ${databricksUtils.convertToColumnType({
        column,
        expression: `:set${index}`,
      })}`;
    });
    const matchColumn = databricksUtils.findColumn({
      columns,
      name: columnName,
    });
    const statement = `UPDATE ${databricksUtils.tableRef({
      catalogName,
      schemaName,
      tableName,
    })} SET ${assignments.join(', ')} WHERE ${databricksUtils.quoteIdentifier({
      name: matchColumn.name,
    })} = ${databricksUtils.convertToColumnType({
      column: matchColumn,
      expression: ':match',
    })}`;
    return await databricksApi.executeWriteStatement({
      auth: context.auth,
      warehouseId,
      statement,
      parameters: [
        ...changed.map((column, index) => ({
          name: `set${index}`,
          value: databricksUtils.toParameterValue({
            value: values[column.name],
          }),
        })),
        { name: 'match', value: matchValue },
      ],
    });
  },
});
