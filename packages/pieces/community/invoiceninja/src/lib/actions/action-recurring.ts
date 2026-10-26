import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from '../common/auth';
import { invoiceNinjaClient } from '../common/client';
import { invoiceNinjaOutputSchemas } from '../common/output-schemas';

export const actionRecurringInvoice = createAction({
  auth: invoiceninjaAuth,
  name: 'action_recurring_invoice',
  classification: 'DESTRUCTIVE',
  displayName: 'Perform Action on Recurring Invoice',
  description: 'Start, stop, send now, restore, archive or delete a recurring invoice.',
  audience: 'human',
  outputSchema: invoiceNinjaOutputSchemas.legacyRecurringAction,
  props: {
    recurring_id: Property.ShortText({
      displayName: 'Recurring Invoice ID',
      description: 'The ID of the recurring invoice in Invoice Ninja.',
      required: true,
    }),
    actionRecurring: Property.StaticDropdown({
      displayName: 'Action to perform',
      description: 'Choose one.',
      defaultValue: 'start',
      required: true,
      options: {
        options: [
          { label: 'Start', value: 'start' },
          { label: 'Stop', value: 'stop' },
          { label: 'Send Now', value: 'send_now' },
          { label: 'Restore', value: 'restore' },
          { label: 'Archive', value: 'archive' },
          { label: 'Delete', value: 'delete' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const action = propsValue.actionRecurring;
    if (!['start', 'stop', 'send_now', 'restore', 'archive', 'delete'].includes(action)) {
      throw new Error('Choose an action to perform.');
    }
    const id = invoiceNinjaClient.parseId({ value: propsValue.recurring_id, label: 'Recurring Invoice ID' });
    const body = await invoiceNinjaClient.request({
      auth: auth.props,
      method: HttpMethod.POST,
      path: '/recurring_invoices/bulk',
      body: { action, ids: [id] },
    });
    const envelope = invoiceNinjaClient.envelopeOf(body);
    if (invoiceNinjaClient.arrayOf(envelope.data).length === 0) {
      throw new Error(`Invoice Ninja did not return recurring invoice ${id}; it may not exist.`);
    }
    return envelope;
  },
});
