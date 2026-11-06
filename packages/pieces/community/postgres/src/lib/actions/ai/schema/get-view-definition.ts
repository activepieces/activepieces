import { createAction, Property } from '@activepieces/pieces-framework';
import { postgresAuth } from '../../../auth';
import { postgresAi } from '../../../ai-common';
import { postgresGetViewDefinitionOutputSchema } from '../../../output-schemas';

export const getViewDefinition = createAction({
  auth: postgresAuth,
  name: 'postgres_get_view_definition',
  outputSchema: postgresGetViewDefinitionOutputSchema,
  displayName: 'Get View Definition',
  description: 'Returns the SQL that defines a view or materialized view.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the SELECT statement behind a view or materialized view, to learn what it computes and which tables it reads. View names come from List Views. Read-only.',
    idempotent: true,
  },
  props: {
    view: Property.ShortText({
      displayName: 'View',
      description: 'View name as returned by List Views, written schema.view (e.g. public.active_orders). A bare name is looked up on the search path.',
      required: true,
    }),
  },
  async run(context) {
    const { view } = context.propsValue;
    return postgresAi.withClient({
      auth: context.auth,
      fn: async (client) => {
        const relation = await postgresAi.resolveRelation({ client, name: view, label: 'View' });
        if (relation.kind !== 'v' && relation.kind !== 'm') {
          throw new Error(`"${view}" is a table, not a view. Use Describe Table for its columns.`);
        }
        const result = await client.query<{ definition: string }>('SELECT pg_get_viewdef($1::oid, true) AS definition', [relation.oid]);
        return {
          schema: relation.schema,
          name: relation.name,
          isMaterialized: relation.kind === 'm',
          definition: result.rows[0]?.definition ?? null,
        };
      },
    });
  },
});
