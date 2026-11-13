import { createAction } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../../../auth';
import { mssqlAi, mssqlAiProps } from '../../../common/ai';
import { microsoftSqlServerListDatabasesOutputSchema } from '../../../output-schemas';

export const listDatabases = createAction({
  auth: mssqlAuth,
  name: 'microsoft_sql_server_list_databases',
  outputSchema: microsoftSqlServerListDatabasesOutputSchema,
  displayName: 'List Databases',
  description: 'Lists the databases on the server that the login can see.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the databases on the server visible to the connection login: name, state, recovery model, compatibility level, collation and whether it is read-only, with the connection database flagged. Every other action works in the connection database, so use this to orient, not to switch databases. Read-only.',
    idempotent: true,
  },
  props: {
    namePattern: mssqlAiProps.namePattern,
  },
  async run(context) {
    const { namePattern } = context.propsValue;
    const hasPattern = namePattern !== undefined && namePattern !== '';
    const databases = await mssqlAi.withPool({
      auth: context.auth,
      fn: async (pool) => {
        const request = pool.request();
        if (hasPattern) {
          request.input('pattern', namePattern);
        }
        const result = await request.query<Record<string, unknown>>(
          `SELECT name, database_id, state_desc AS state, recovery_model_desc AS recovery_model,
                  compatibility_level, collation_name, is_read_only,
                  CAST(CASE WHEN name = DB_NAME() THEN 1 ELSE 0 END AS bit) AS is_current,
                  CONVERT(varchar(33), create_date, 126) AS create_date
           FROM sys.databases${hasPattern ? ' WHERE name LIKE @pattern' : ''}
           ORDER BY name`
        );
        return result.recordset;
      },
    });
    return { databases, count: databases.length };
  },
});
