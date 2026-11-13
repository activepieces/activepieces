import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { listRecords, optionalId, pageParams } from '../common/client';
import { pageProps, storeDropdown } from '../common/props';
import { flatFields, listSchema } from '../common/output-schemas';

export const listSubscriptionInvoices = createAction({
  auth: lemonSqueezyAuth,
  name: 'list_subscription_invoices',
  displayName: 'List Subscription Invoices',
  description: 'List subscription invoices (renewal payments).',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists Lemon Squeezy subscription invoices (initial, renewal and plan-change payments), optionally filtered by store, subscription ID, status (paid, pending, void, refunded, partial_refund) or refunded flag, with page-based pagination. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listSchema({ fields: flatFields.subscriptionInvoice, itemLabel: 'total_formatted' }),
  props: {
    storeId: storeDropdown({ required: false, description: 'Filter by store. Leave empty to include every store the API key can see.' }),
    subscriptionId: Property.ShortText({
      displayName: 'Subscription ID',
      description: 'Only invoices of this subscription.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Paid', value: 'paid' },
          { label: 'Pending', value: 'pending' },
          { label: 'Void', value: 'void' },
          { label: 'Refunded', value: 'refunded' },
          { label: 'Partially Refunded', value: 'partial_refund' },
        ],
      },
    }),
    ...pageProps('invoices'),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return listRecords({
      apiKey: auth.secret_text,
      path: '/subscription-invoices',
      query: {
        'filter[store_id]': optionalId({ value: propsValue.storeId, label: 'Store' }),
        'filter[subscription_id]': optionalId({ value: propsValue.subscriptionId, label: 'Subscription ID' }),
        'filter[status]': propsValue.status ?? undefined,
        ...pageParams(propsValue),
      },
    });
  },
});
