import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListDatabasesOutputSchema } from '../../output-schemas';

export const listDatabasesAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_databases',
  outputSchema: metabaseListDatabasesOutputSchema,
  displayName: 'List Databases',
  description: 'List the connected databases.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      "Lists the data warehouses connected to Metabase with their ids and engines; optionally include each one's tables. Database ids feed Run Query, Create Card and the table actions.",
    idempotent: true,
  },
  props: {
    include: Property.StaticDropdown({
      displayName: 'Include',
      description:
        "Also return each database's tables. Empty = databases only.",
      required: false,
      options: {
        disabled: false,
        options: [{ label: 'Tables', value: 'tables' }],
      },
    }),
  },
  async run({ auth, propsValue }) {
    return await metabaseApi.listDatabases({
      auth,
      include: propsValue.include,
    });
  },
});
