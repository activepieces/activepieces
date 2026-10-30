import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

import { wooAuth } from '../auth';
import { wooPathId } from '../common/path-id';
import { updateOrderOutputSchema } from '../output-schemas';

export const wooUpdateOrder = createAction({
  name: 'Update Order',
  classification: 'WRITE',
  displayName: 'Update Order',
  description: 'Update an order, most commonly its status',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates an existing WooCommerce order by ID. Most often used to move an order through its lifecycle by setting status (pending, processing, on-hold, completed, cancelled, refunded, failed), and can also set the customer note or transaction ID. Only the fields provided are changed. Idempotent: applying the same status twice leaves the order in the same state.',
    idempotent: true,
  },
  auth: wooAuth,
  outputSchema: updateOrderOutputSchema,
  propertyGroups: [
    {
      key: 'order',
      display: 'section',
      label: 'Order to Update',
      icon: 'inbox',
      props: ['id'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'sliders',
      props: ['changes_info', 'status', 'transaction_id', 'customer_note'],
    },
  ],
  props: {
    id: Property.ShortText({
      displayName: 'Order ID',
      description: 'The number after # in WooCommerce > Orders.',
      placeholder: '123',
      required: true,
    }),
    changes_info: Property.MarkDown({
      value: 'Empty fields keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'New status for the order.',
      width: 'half',
      required: false,
      options: {
        options: [
          { label: 'Pending payment', value: 'pending' },
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
      description: 'The note the customer left at checkout.',
      required: false,
    }),
    transaction_id: Property.ShortText({
      displayName: 'Transaction ID',
      description: 'Payment reference from your payment gateway.',
      width: 'half',
      required: false,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.props.baseUrl.replace(/\/$/, '');
    const { id, status, customer_note, transaction_id } =
      configValue.propsValue;

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
      url: `${trimmedBaseUrl}/wp-json/wc/v3/orders/${wooPathId.encode({ id, label: 'Order ID' })}`,
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
