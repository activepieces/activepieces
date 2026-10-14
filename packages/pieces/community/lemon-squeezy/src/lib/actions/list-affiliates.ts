import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { listRecords, optionalId, pageParams } from '../common/client';
import { pageProps } from '../common/props';
import { flatFields, listSchema } from '../common/output-schemas';

export const listAffiliates = createAction({
  auth: lemonSqueezyAuth,
  name: 'list_affiliates',
  displayName: 'List Affiliates',
  description: 'List affiliates, optionally by store or email.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Lemon Squeezy affiliates with their status and total/unpaid earnings in cents, optionally filtered by store ID or exact affiliate email, with page-based pagination. Use to look up an affiliate before a payout or to report on the affiliate program. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listSchema({ fields: flatFields.affiliate, itemLabel: 'user_email' }),
  props: {
    storeId: Property.ShortText({ displayName: 'Store ID', description: 'Only affiliates of this store.', required: false }),
    userEmail: Property.ShortText({ displayName: 'Affiliate Email', description: 'Exact email of the affiliate.', required: false }),
    ...pageProps('affiliates'),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return listRecords({
      apiKey: auth.secret_text,
      path: '/affiliates',
      query: {
        'filter[store_id]': optionalId({ value: propsValue.storeId, label: 'Store ID' }),
        'filter[user_email]': propsValue.userEmail?.trim() || undefined,
        ...pageParams(propsValue),
      },
    });
  },
});
