import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListDatabaseSchemasOutputSchema } from '../../output-schemas';

export const listDatabaseSchemasAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_database_schemas',
  outputSchema: metabaseListDatabaseSchemasOutputSchema,
  displayName: 'List Database Schemas',
  description: 'List the schemas of a database.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the schema names in a connected database. Pass one to List Schema Tables.',
    idempotent: true,
  },
  props: {
    databaseId: metabaseAiProps.databaseId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const schemas = await metabaseApi.listDatabaseSchemas({
      auth,
      databaseId: propsValue.databaseId,
    });
    return { schemas, count: schemas.length };
  },
});
