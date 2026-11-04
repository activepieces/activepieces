import { createAction } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../../../auth';
import { mssqlAi } from '../../../common/ai';
import { microsoftSqlServerListSchemasOutputSchema } from '../../../output-schemas';

export const listSchemas = createAction({
  auth: mssqlAuth,
  name: 'microsoft_sql_server_list_schemas',
  outputSchema: microsoftSqlServerListSchemasOutputSchema,
  displayName: 'List Schemas',
  description: 'Lists the schemas in the connection database.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the user schemas in the connection database with their owner and how many tables and views each holds, and flags the connection user\'s default schema (used when an action\'s Schema is left empty). System and fixed-role schemas are left out. Read-only.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const schemas = await mssqlAi.withPool({
      auth: context.auth,
      fn: async (pool) => {
        const result = await pool.request().query<Record<string, unknown>>(
          `SELECT s.name, p.name AS owner,
                  (SELECT COUNT(*) FROM sys.tables t WHERE t.schema_id = s.schema_id) AS table_count,
                  (SELECT COUNT(*) FROM sys.views v WHERE v.schema_id = s.schema_id) AS view_count,
                  CAST(CASE WHEN s.name = SCHEMA_NAME() THEN 1 ELSE 0 END AS bit) AS is_default
           FROM sys.schemas s
           LEFT JOIN sys.database_principals p ON p.principal_id = s.principal_id
           WHERE s.schema_id < 16384 AND s.name NOT IN ('sys', 'INFORMATION_SCHEMA', 'guest')
           ORDER BY s.name`
        );
        return result.recordset;
      },
    });
    return { schemas, count: schemas.length };
  },
});
