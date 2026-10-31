import { createAction } from '@activepieces/pieces-framework';
import { postgresAuth } from '../../../auth';
import { postgresAi, postgresAiProps } from '../../../ai-common';
import { postgresListRoutinesOutputSchema } from '../../../output-schemas';

export const listRoutines = createAction({
  auth: postgresAuth,
  name: 'postgres_list_routines',
  outputSchema: postgresListRoutinesOutputSchema,
  displayName: 'List Routines',
  description: 'Lists the user-defined functions and procedures in the database.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists user-defined functions and procedures (not built-ins or extension functions) with their schema, kind, argument list, return type and language, optionally in one schema or matching a LIKE name pattern. Use before Call Routine to learn the name and the arguments to pass in order. Read-only.',
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
      { sql: 'p.proname LIKE $', value: namePattern },
    ].filter((condition) => condition.value !== undefined && condition.value !== '');
    const where = conditions.map((condition, index) => ` AND ${condition.sql}${index + 1}`).join('');
    const result = await postgresAi.withClient({
      auth: context.auth,
      fn: (client) =>
        client.query(
          `SELECT n.nspname AS schema, p.proname AS name, CASE p.prokind WHEN 'p' THEN 'procedure' ELSE 'function' END AS kind, pg_get_function_identity_arguments(p.oid) AS arguments, pg_get_function_result(p.oid) AS returns, l.lanname AS language FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace JOIN pg_language l ON l.oid = p.prolang WHERE p.prokind IN ('f', 'p') AND ${postgresAi.notSystemSchema({ column: 'n.nspname' })} AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.classid = 'pg_proc'::regclass AND d.objid = p.oid AND d.deptype = 'e')${where} ORDER BY n.nspname, p.proname`,
          conditions.map((condition) => condition.value),
        ),
    });
    return { routines: result.rows, count: result.rows.length };
  },
});
