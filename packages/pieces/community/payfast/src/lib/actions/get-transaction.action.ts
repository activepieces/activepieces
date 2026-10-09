import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { payfastAuth } from '../auth';
import { payfastApiRequest } from '../common/client';

export const getTransactionAction = createAction({
  auth: payfastAuth,
  name: 'get_transaction',
  displayName: 'Get Transaction',
  description:
    'Fetch a single transaction by its PayFast transaction ID (pf_payment_id) or your own reference (m_payment_id).',
  props: {
    search_by: Property.StaticDropdown({
      displayName: 'Search By',
      required: true,
      defaultValue: 'm_payment_id',
      options: {
        options: [
          { label: 'Your Reference (m_payment_id)', value: 'm_payment_id' },
          { label: 'PayFast Transaction ID (pf_payment_id)', value: 'pf_payment_id' },
        ],
      },
    }),
    value: Property.ShortText({
      displayName: 'Reference Value',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return payfastApiRequest<Record<string, unknown>>({
      auth: auth.props,
      method: HttpMethod.GET,
      path: '/transactions',
      query: {
        [propsValue.search_by as string]: propsValue.value as string,
      },
    });
  },
});
