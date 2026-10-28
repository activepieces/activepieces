import { createAction } from '@activepieces/pieces-framework';

import { databricksAuth } from '../auth';
import { databricksApi } from '../common/api';
import { databricksProps } from '../common/props';
import { databricksUtils } from '../common/utils';
import { upsertResultOutputSchema } from '../output-schemas';

export const upsertRowAction = createAction({
  auth: databricksAuth,
  name: 'upsert_row',
  classification: 'WRITE',
  displayName: 'Upsert Row',
  description:
    'Updates the row with a matching key, or inserts it if no row matches (MERGE).',
  audience: 'both',
  aiMetadata: {
    description:
      'Insert or update one row in a Databricks Unity Catalog table using MERGE, matched on a key column. Use this when you do not know whether the row exists; the key column value is required. Keyed on a stable value, so safe to retry.',
    idempotent: true,
  },
  props: {
    warehouseId: databricksProps.warehouseId({ required: true }),
    catalogName: databricksProps.catalogName({ required: true }),
    schemaName: databricksProps.schemaName({ required: true }),
    tableName: databricksProps.tableName({ required: true }),
    columnName: databricksProps.columnName({
      required: true,
      displayName: 'Key Column',
      description:
        'The column that identifies a row, e.g. id or email. A row with the same value is updated; otherwise a new row is inserted.',
    }),
    rowFields: databricksProps.rowFields({
      required: true,
      description:
        'One field per table column. The key column must be filled in. Empty fields are not changed on update and inserted as NULL.',
    }),
  },
  outputSchema: upsertResultOutputSchema,
  async run(context) {
    const {
      warehouseId,
      catalogName,
      schemaName,
      tableName,
      columnName,
      rowFields,
    } = context.propsValue;
    const table = await databricksApi.getTable({
      auth: context.auth,
      catalogName,
      schemaName,
      tableName,
    });
    const row = databricksUtils.compactRow({ row: rowFields ?? {} });
    if (row[columnName] === undefined) {
      throw new Error(`Fill in the key column "${columnName}".`);
    }
    const source = databricksUtils.buildRowSource({
      columns: table.columns ?? [],
      rows: [row],
    });
    const quoted = source.columnNames.map((name) =>
      databricksUtils.quoteIdentifier({ name })
    );
    const key = databricksUtils.quoteIdentifier({ name: columnName });
    const updates = quoted
      .filter((name) => name !== key)
      .map((name) => `target.${name} = source.${name}`);
    const statement = [
      `MERGE INTO ${databricksUtils.tableRef({
        catalogName,
        schemaName,
        tableName,
      })} AS target`,
      `USING (${source.sql}) AS source`,
      `ON target.${key} = source.${key}`,
      updates.length > 0
        ? `WHEN MATCHED THEN UPDATE SET ${updates.join(', ')}`
        : '',
      `WHEN NOT MATCHED THEN INSERT (${quoted.join(', ')}) VALUES (${quoted
        .map((name) => `source.${name}`)
        .join(', ')})`,
    ]
      .filter((line) => line !== '')
      .join(' ');
    return await databricksApi.executeWriteStatement({
      auth: context.auth,
      warehouseId,
      statement,
      parameters: source.parameters,
    });
  },
});
