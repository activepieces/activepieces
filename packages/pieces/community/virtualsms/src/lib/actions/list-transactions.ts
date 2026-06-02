import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { request, virtualSmsAuth } from '../common';

export const listTransactions = createAction({
  auth: virtualSmsAuth,
  name: 'list_transactions',
  displayName: 'List Transactions',
  description:
    'Retrieve paginated account transaction history (deposits, charges, refunds, credits).',
  props: {
    type: Property.StaticDropdown({
      displayName: 'Transaction Type',
      description: 'Filter by type. Leave blank to return all types.',
      required: false,
      options: {
        options: [
          { label: 'Deposit', value: 'deposit' },
          { label: 'Charge', value: 'charge' },
          { label: 'Refund', value: 'refund' },
          { label: 'Credit', value: 'credit' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of transactions to return.',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of transactions to skip for pagination.',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    return request(auth, HttpMethod.GET, '/api/v1/customer/transactions', undefined, {
      type: propsValue.type ?? undefined,
      limit: propsValue.limit !== undefined ? String(propsValue.limit) : undefined,
      offset: propsValue.offset !== undefined ? String(propsValue.offset) : undefined,
    });
  },
});
