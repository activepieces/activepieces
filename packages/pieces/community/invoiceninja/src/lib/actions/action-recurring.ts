import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';

import { invoiceninjaAuth } from '../..';

export const actionRecurringInvoice = createAction({
  auth: invoiceninjaAuth,
  name: 'action_recurring_invoice',
  displayName: 'Perform Action on Recurring Invoice',
  description:
    'Actions include: start, stop, send_now, restore, archive, delete.',
  props: {
    recurring_id: Property.LongText({
      displayName: 'Recurring Invoice ID (alphanumeric)',
      description: 'Recurring Invoice ID from Invoice Ninja',
      required: true,
    }),
    actionRecurring: Property.StaticDropdown({
      displayName: 'Action to perform',
      description: 'Choose one',
      defaultValue: 1,
      required: true,
      options: {
        options: [
          {
            label: 'Start',
            value: 'start',
          },
          {
            label: 'Stop',
            value: 'stop',
          },
          {
            label: 'Send Now',
            value: 'send_now',
          },
          {
            label: 'Restore',
            value: 'restore',
          },
          {
            label: 'Archive',
            value: 'archive',
          },
          {
            label: 'Delete',
            value: 'delete',
          },
        ],
      },
    }),
  },

  async run(context) {
    const INapiToken = context.auth.access_token;
    const headers = {
      'X-Api-Token': INapiToken,
      'Content-Type': 'application/json',
    };

    const baseUrl = context.auth.base_url.replace(/\/$/, '');
    const i: string[] = [context.propsValue.recurring_id];

    const createRequestBody = {
      action: context.propsValue.actionRecurring,
      ids: i,
    };
    const createRequestResponse = await fetch(
      `${baseUrl}/api/v1/recurring_invoices/bulk`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(createRequestBody),
      }
    );

    if (!createRequestResponse.ok) {
      throw new Error(
        `Failed to perform action on recurring invoice. Status: ${createRequestResponse.status}`
      );
    }

    const createResponseBody = await createRequestResponse.json();

    return createResponseBody;
  },
});
