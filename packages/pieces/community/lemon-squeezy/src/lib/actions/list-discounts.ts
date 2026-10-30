import { createAction } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { listRecords, optionalId, pageParams } from '../common/client';
import { pageProps, storeDropdown } from '../common/props';
import { flatFields, listSchema } from '../common/output-schemas';

export const listDiscounts = createAction({
  auth: lemonSqueezyAuth,
  name: 'list_discounts',
  displayName: 'List Discounts',
  description: 'List discount codes.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Lemon Squeezy discount codes, optionally for one store, with page-based pagination. Use to check whether a code exists or find a discount ID to delete. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listSchema({ fields: flatFields.discount, itemLabel: 'code' }),
  props: {
    storeId: storeDropdown({ required: false, description: 'Filter by store. Leave empty to include every store the API key can see.' }),
    ...pageProps('discounts'),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return listRecords({
      apiKey: auth.secret_text,
      path: '/discounts',
      query: {
        'filter[store_id]': optionalId({ value: propsValue.storeId, label: 'Store' }),
        ...pageParams(propsValue),
      },
    });
  },
});
