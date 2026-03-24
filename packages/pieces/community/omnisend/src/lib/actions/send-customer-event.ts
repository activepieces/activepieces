import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { omnisendAuth } from '../auth';
import { omnisendRequest } from '../common/client';

export const sendCustomerEventAction = createAction({
  auth: omnisendAuth,
  name: 'send_customer_event',
  displayName: 'Send Customer Event',
  description:
    'Send a customer event to Omnisend. Events track customer behavior and trigger automations (e.g. welcome emails, abandoned cart reminders). Use predefined events or create custom ones.',
  props: {
    email: Property.ShortText({
      displayName: 'Contact Email',
      description: 'Email address of the contact to send the event for.',
      required: true,
    }),
    eventName: Property.ShortText({
      displayName: 'Event Name',
      description:
        'The name of the event. Use predefined names (e.g. "added product to cart", "placed order") or a custom event name.',
      required: true,
    }),
    fields: Property.Object({
      displayName: 'Event Fields',
      description:
        'Custom key-value fields to include with the event (e.g. {"orderId": "12345", "totalPrice": 99.99}).',
      required: false,
    }),
  },
  async run(context) {
    const { email, eventName, fields } = context.propsValue;

    const body: Record<string, unknown> = {
      email,
      eventName,
    };

    if (
      fields &&
      Object.keys(fields as Record<string, unknown>).length > 0
    ) {
      body['fields'] = fields;
    }

    return omnisendRequest(
      HttpMethod.POST,
      '/events',
      context.auth.secret_text,
      body,
    );
  },
});
