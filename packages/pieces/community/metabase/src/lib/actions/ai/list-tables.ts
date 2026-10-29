import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListTablesOutputSchema } from '../../output-schemas';

export const listTablesAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_tables',
  outputSchema: metabaseListTablesOutputSchema,
  displayName: 'List Tables',
  description: 'List tables across all connected databases.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the tables Metabase knows about across all databases, with ids, schemas and database ids, optionally matching a name. Metabase returns the whole list in one call; use List Schema Tables to narrow by schema.',
    idempotent: true,
  },
  props: {
    term: Property.ShortText({
      displayName: 'Name Contains',
      description:
        'Only tables whose name matches this text. Empty = all tables.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const tables = await metabaseApi.listTables({
      auth,
      term: propsValue.term,
    });
    return { tables, count: tables.length };
  },
});
