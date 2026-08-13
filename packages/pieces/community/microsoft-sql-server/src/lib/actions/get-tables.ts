import { createAction } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../auth';
import { mssqlCommon } from '../common';
import { getTablesActionOutputSchema } from '../output-schemas';

export const getTablesAction = createAction({
  auth: mssqlAuth,
  name: 'get_tables',
  displayName: 'Get Tables',
  description: 'Returns a list of tables in the database',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists every base table in the connected SQL Server database, with its schema and name (from INFORMATION_SCHEMA.TABLES). Use to discover the schema before reading or writing rows. Takes no input; read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema: getTablesActionOutputSchema,
  async run(context) {
    const pool = await mssqlCommon.connect({ auth: context.auth });
    try {
      const tables = await mssqlCommon.getTables(pool);
      return tables.map((table) => ({
        table_schema: table.table_schema,
        table_name: table.table_name,
        full_name: `${table.table_schema}.${table.table_name}`,
      }));
    } finally {
      await pool.close();
    }
  },
});
