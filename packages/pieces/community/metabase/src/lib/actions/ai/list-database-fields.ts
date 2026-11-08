import { createAction } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListDatabaseFieldsOutputSchema } from '../../output-schemas';

export const listDatabaseFieldsAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_database_fields',
  outputSchema: metabaseListDatabaseFieldsOutputSchema,
  displayName: 'List Database Fields',
  description: 'List every field of a database.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every field (column) of a connected database with its id, table and type. Field ids feed the field actions.',
    idempotent: true,
  },
  props: {
    databaseId: metabaseAiProps.databaseId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const fields = await metabaseApi.listDatabaseFields({
      auth,
      databaseId: propsValue.databaseId,
    });
    return { fields, count: fields.length };
  },
});
