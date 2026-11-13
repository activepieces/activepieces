import { createAction } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { listRecords, pageParams } from '../common/client';
import { pageProps } from '../common/props';
import { flatFields, listSchema } from '../common/output-schemas';

export const listStores = createAction({
  auth: lemonSqueezyAuth,
  name: 'list_stores',
  displayName: 'List Stores',
  description: 'List the stores your API key can access.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Lemon Squeezy stores the connected API key can access, with page-based pagination. Use to find a store ID for other actions (create customer, create discount, create checkout). Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listSchema({ fields: flatFields.store, itemLabel: 'name' }),
  props: {
    ...pageProps('stores'),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return listRecords({ apiKey: auth.secret_text, path: '/stores', query: pageParams(propsValue) });
  },
});
