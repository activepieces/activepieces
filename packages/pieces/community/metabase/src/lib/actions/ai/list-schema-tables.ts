import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListSchemaTablesOutputSchema } from '../../output-schemas';

export const listSchemaTablesAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_schema_tables',
  outputSchema: metabaseListSchemaTablesOutputSchema,
  displayName: 'List Schema Tables',
  description: 'List the tables in one schema of a database.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the tables in one schema of a connected database, with their ids. Get schema names from List Database Schemas.',
    idempotent: true,
  },
  props: {
    databaseId: metabaseAiProps.databaseId({ required: true }),
    schema: Property.ShortText({
      displayName: 'Schema',
      description: 'Schema name, e.g. "public", from List Database Schemas.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const tables = await metabaseApi.listSchemaTables({
      auth,
      databaseId: propsValue.databaseId,
      schema: encodeURIComponent(propsValue.schema),
    });
    return { tables, count: tables.length };
  },
});
