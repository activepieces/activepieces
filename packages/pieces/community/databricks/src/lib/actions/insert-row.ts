import { createAction } from '@activepieces/pieces-framework';

import { databricksAuth } from '../auth';
import { databricksApi } from '../common/api';
import { databricksProps } from '../common/props';
import { databricksUtils } from '../common/utils';
import { insertResultOutputSchema } from '../output-schemas';

export const insertRowAction = createAction({
  auth: databricksAuth,
  name: 'insert_row',
  classification: 'WRITE',
  displayName: 'Insert Row',
  description: 'Adds one row to a Unity Catalog table.',
  audience: 'both',
  aiMetadata: {
    description:
      'Insert a single row into a Databricks Unity Catalog table, filling one value per column. For many rows at once use Insert Multiple Rows; to insert-or-update by a key use Upsert Row. Each call adds a new row, so retries duplicate.',
    idempotent: false,
  },
  props: {
    warehouseId: databricksProps.warehouseId({ required: true }),
    catalogName: databricksProps.catalogName({ required: true }),
    schemaName: databricksProps.schemaName({ required: true }),
    tableName: databricksProps.tableName({ required: true }),
    rowFields: databricksProps.rowFields({ required: true }),
  },
  outputSchema: insertResultOutputSchema,
  async run(context) {
    const { warehouseId, catalogName, schemaName, tableName, rowFields } =
      context.propsValue;
    const table = await databricksApi.getTable({
      auth: context.auth,
      catalogName,
      schemaName,
      tableName,
    });
    const source = databricksUtils.buildRowSource({
      columns: table.columns ?? [],
      rows: [databricksUtils.compactRow({ row: rowFields ?? {} })],
    });
    const columnList = source.columnNames
      .map((name) => databricksUtils.quoteIdentifier({ name }))
      .join(', ');
    return await databricksApi.executeWriteStatement({
      auth: context.auth,
      warehouseId,
      statement: `INSERT INTO ${databricksUtils.tableRef({
        catalogName,
        schemaName,
        tableName,
      })} (${columnList}) ${source.sql}`,
      parameters: source.parameters,
    });
  },
});
