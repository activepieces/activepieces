import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetDatabaseOutputSchema } from '../../output-schemas';

export const getDatabaseAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_database',
  outputSchema: metabaseGetDatabaseOutputSchema,
  displayName: 'Get Database',
  description: 'Get a connected database by ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one connected database (engine, settings, sync status), optionally with its tables and their fields.',
    idempotent: true,
  },
  props: {
    databaseId: metabaseAiProps.databaseId({ required: true }),
    include: Property.StaticDropdown({
      displayName: 'Include',
      description:
        'Also return tables, or tables with their fields. Empty = database only.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Tables', value: 'tables' },
          { label: 'Tables and fields', value: 'tables.fields' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.getDatabase({
      auth,
      databaseId: propsValue.databaseId,
      include: propsValue.include,
    });
  },
});
