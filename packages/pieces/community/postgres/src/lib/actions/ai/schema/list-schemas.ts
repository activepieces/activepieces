import { createAction } from '@activepieces/pieces-framework';
import { postgresAuth } from '../../../auth';
import { postgresAi, postgresAiProps } from '../../../ai-common';
import { postgresListSchemasOutputSchema } from '../../../output-schemas';

export const listSchemas = createAction({
  auth: postgresAuth,
  name: 'postgres_list_schemas',
  outputSchema: postgresListSchemasOutputSchema,
  displayName: 'List Schemas',
  description: 'Lists the schemas in the connected database.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists the non-system schemas of the connected database with their owner, and marks the one tables resolve to by default (current). Use first to learn where tables live; Get Tables, List Views and List Routines take or return these schema names. Read-only.',
    idempotent: true,
  },
  props: {
    namePattern: postgresAiProps.namePattern,
  },
  async run(context) {
    const { namePattern } = context.propsValue;
    const hasPattern = namePattern !== undefined && namePattern !== '';
    const result = await postgresAi.withClient({
      auth: context.auth,
      fn: (client) =>
        client.query(
          `SELECT nspname AS name, pg_get_userbyid(nspowner) AS owner, nspname = current_schema() AS current FROM pg_namespace WHERE ${postgresAi.notSystemSchema({ column: 'nspname' })}${hasPattern ? ' AND nspname LIKE $1' : ''} ORDER BY nspname`,
          hasPattern ? [namePattern] : [],
        ),
    });
    return { schemas: result.rows, count: result.rows.length };
  },
});
