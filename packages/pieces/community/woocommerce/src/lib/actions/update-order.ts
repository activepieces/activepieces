import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

import { wooAuth } from '../auth';
import { updateOrderOutputSchema } from '../output-schemas';

export const wooUpdateOrder = createAction({
  name: 'Update Order',
  classification: 'WRITE',
  displayName: 'Update Order',
  description: 'Update an order, most commonly its status',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates an existing WooCommerce order by ID. Most often used to move an order through its lifecycle by setting status (pending, processing, on-hold, completed, cancelled, refunded, failed), and can also set the customer note or transaction ID. Only the fields provided are changed. Idempotent: applying the same status twice leaves the order in the same state.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: updateOrderOutputSchema,
  props: {
    id: Property.ShortText({
      displayName: 'Order ID',
      description: 'Enter the order ID',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'New status for the order',
      required: false,
      options: {
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Processing', value: 'processing' },
          { label: 'On hold', value: 'on-hold' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' },
          { label: 'Refunded', value: 'refunded' },
          { label: 'Failed', value: 'failed' },
        ],
      },
    }),
    customer_note: Property.LongText({
      displayName: 'Customer Note',
      description: 'Note shown to the customer',
      required: false,
    }),
    transaction_id: Property.ShortText({
      displayName: 'Transaction ID',
      description: 'Payment transaction reference',
      required: false,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.props.baseUrl.replace(/\/$/, '');
    const { id, status, customer_note, transaction_id } = configValue.propsValue;

    const body: Record<string, string> = {};
    if (status) {
      body['status'] = status;
    }
    if (customer_note) {
      body['customer_note'] = customer_note;
    }
    if (transaction_id) {
      body['transaction_id'] = transaction_id;
    }

    const request: HttpRequest = {
      method: HttpMethod.PUT,
      url: `${trimmedBaseUrl}/wp-json/wc/v3/orders/${id}`,
      authentication: {
        type: AuthenticationType.BASIC,
        username: configValue.auth.props.consumerKey,
        password: configValue.auth.props.consumerSecret,
      },
      body,
    };

    const res = await httpClient.sendRequest(request);

    return res.body;
  },
});
