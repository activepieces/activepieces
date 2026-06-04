import { createAction, Property } from '@activepieces/pieces-framework';
import { qawafelAuth } from '../common/auth';
import { qawafelPaginatedList } from '../common/client';
import { qawafelProps } from '../common/props';
import { URLSearchParams } from 'url';

const INVOICE_STATES: { label: string; value: string }[] = [
  { label: 'Draft', value: 'draft' },
  { label: 'Pushed (submitted to ZATCA)', value: 'pushed' },
  { label: 'Sent', value: 'sent' },
  { label: 'Paid', value: 'paid' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Void', value: 'void' },
];

export const listInvoices = createAction({
  auth: qawafelAuth,
  name: 'list_invoices',
  displayName: 'List Invoices',
  description:
    'Get invoices, optionally filtered by status, customer, or creation date. Returns up to 500 invoices (5 pages of 100).',
  props: {
    state: Property.StaticDropdown<string>({
      displayName: 'Status (filter)',
      description:
        'Optional. Return only invoices in this state. Leave blank for all statuses.',
      required: false,
      options: {
        disabled: false,
        options: INVOICE_STATES,
      },
    }),
    merchant_id: qawafelProps.merchantDropdown({
      displayName: 'Customer (filter)',
      description:
        'Optional. Return only invoices for this customer. Leave blank for all customers.',
      required: false,
      type: 'customer',
    }),
    created_after: Property.DateTime({
      displayName: 'Created After',
      description:
        'Optional. Return only invoices created after this date and time.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams = new URLSearchParams();
    if (propsValue.state) {
      queryParams.append('state', propsValue.state);
    }
    if (propsValue.merchant_id) {
      queryParams.append('merchant_id', propsValue.merchant_id);
    }
    if (propsValue.created_after) {
      queryParams.append('created_after', propsValue.created_after);
    }

    const data = await qawafelPaginatedList({
      auth,
      path: `/invoices?${queryParams.toString()}`,
    });
    return { count: data.length, data };
  },
});
