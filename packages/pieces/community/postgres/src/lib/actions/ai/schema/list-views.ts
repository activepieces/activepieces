import { createAction } from '@activepieces/pieces-framework';
import { postgresAuth } from '../../../auth';
import { postgresAi, postgresAiProps } from '../../../ai-common';
import { postgresListViewsOutputSchema } from '../../../output-schemas';

export const listViews = createAction({
  auth: postgresAuth,
  name: 'postgres_list_views',
  outputSchema: postgresListViewsOutputSchema,
  displayName: 'List Views',
  description: 'Lists the views and materialized views in the database.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists views and materialized views with their schema, optionally in one schema or matching a LIKE name pattern. Views are read like tables with Find Rows or Run Select Query; Get View Definition shows the SQL behind one. Schema names come from List Schemas. Read-only.',
    idempotent: true,
  },
  props: {
    schema: postgresAiProps.schema,
    namePattern: postgresAiProps.namePattern,
  },
  async run(context) {
    const { schema, namePattern } = context.propsValue;
    const conditions = [
      { sql: 'n.nspname = $', value: schema },
      { sql: 'c.relname LIKE $', value: namePattern },
    ].filter((condition) => condition.value !== undefined && condition.value !== '');
    const where = conditions.map((condition, index) => ` AND ${condition.sql}${index + 1}`).join('');
    const result = await postgresAi.withClient({
      auth: context.auth,
      fn: (client) =>
        client.query(
          `SELECT n.nspname AS schema, c.relname AS name, c.relkind = 'm' AS "isMaterialized", pg_get_userbyid(c.relowner) AS owner FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind IN ('v', 'm') AND ${postgresAi.notSystemSchema({ column: 'n.nspname' })}${where} ORDER BY n.nspname, c.relname`,
          conditions.map((condition) => condition.value),
        ),
    });
    return { views: result.rows, count: result.rows.length };
  },
});
