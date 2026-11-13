import { createAction } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../../../auth';
import { mssqlAi, mssqlAiProps } from '../../../common/ai';
import { microsoftSqlServerListViewsOutputSchema } from '../../../output-schemas';

export const listViews = createAction({
  auth: mssqlAuth,
  name: 'microsoft_sql_server_list_views',
  outputSchema: microsoftSqlServerListViewsOutputSchema,
  displayName: 'List Views',
  description: 'Lists the views in the connection database.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the views in the connection database, optionally in one schema and matching a name pattern: schema, name, whether it is schema-bound or indexed, and when it was created and last changed. Views can be read with Find Rows and Count Rows like tables; use Get View Definition for the query behind one. Read-only.',
    idempotent: true,
  },
  props: {
    schema: {
      ...mssqlAiProps.schema,
      description: 'Only list views in this schema. Leave empty for all schemas.',
    },
    namePattern: mssqlAiProps.namePattern,
  },
  async run(context) {
    const { schema, namePattern } = context.propsValue;
    const views = await mssqlAi.withPool({
      auth: context.auth,
      fn: async (pool) => {
        const request = pool.request().input('schema', schema || null).input('pattern', namePattern || null);
        const result = await request.query<Record<string, unknown>>(
          `SELECT SCHEMA_NAME(v.schema_id) AS [schema], v.name,
                  CAST(OBJECTPROPERTY(v.object_id, 'IsSchemaBound') AS bit) AS is_schema_bound,
                  CAST(OBJECTPROPERTY(v.object_id, 'IsIndexed') AS bit) AS is_indexed,
                  CONVERT(varchar(33), v.create_date, 126) AS create_date,
                  CONVERT(varchar(33), v.modify_date, 126) AS modify_date
           FROM sys.views v
           WHERE v.is_ms_shipped = 0
             AND (@schema IS NULL OR SCHEMA_NAME(v.schema_id) = @schema)
             AND (@pattern IS NULL OR v.name LIKE @pattern)
           ORDER BY [schema], v.name`
        );
        return result.recordset;
      },
    });
    return { views, count: views.length };
  },
});
