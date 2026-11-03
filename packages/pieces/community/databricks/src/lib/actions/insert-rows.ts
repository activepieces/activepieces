import { createAction } from '@activepieces/pieces-framework';

import { databricksAuth } from '../auth';
import { databricksApi } from '../common/api';
import { databricksProps } from '../common/props';
import { databricksUtils } from '../common/utils';
import { insertResultOutputSchema } from '../output-schemas';

export const insertRowsAction = createAction({
  auth: databricksAuth,
  name: 'insert_rows',
  classification: 'WRITE',
  displayName: 'Insert Multiple Rows',
  description: 'Adds many rows to a Unity Catalog table in one statement.',
  audience: 'both',
  aiMetadata: {
    description:
      'Insert a batch of rows into a Databricks Unity Catalog table in a single atomic INSERT. Pass rows as an array of objects keyed by column name; missing or empty fields become NULL. For files (CSV/JSON) use Upload File to Volume with a target table instead. Each call adds new rows, so retries duplicate.',
    idempotent: false,
  },
  props: {
    warehouseId: databricksProps.warehouseId({ required: true }),
    catalogName: databricksProps.catalogName({ required: true }),
    schemaName: databricksProps.schemaName({ required: true }),
    tableName: databricksProps.tableName({ required: true }),
    batch: databricksProps.rowList({ required: true }),
  },
  outputSchema: insertResultOutputSchema,
  async run(context) {
    const { warehouseId, catalogName, schemaName, tableName, batch } =
      context.propsValue;
    const rows = batch?.['rows'];
    const rowList = Array.isArray(rows) ? rows : [rows];
    if (rows === undefined || rows === null || rowList.length === 0) {
      throw new Error('Rows must contain at least one row.');
    }
    const table = await databricksApi.getTable({
      auth: context.auth,
      catalogName,
      schemaName,
      tableName,
    });
    const source = databricksUtils.buildRowSource({
      columns: table.columns ?? [],
      rows: rowList.map((row) => {
        if (row === null || typeof row !== 'object' || Array.isArray(row)) {
          throw new Error(
            'Each row must be a JSON object keyed by column name.'
          );
        }
        return databricksUtils.compactRow({ row: Object.fromEntries(Object.entries(row)) });
      }),
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
