import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

import { wooAuth } from '../auth';
import { createOrderOutputSchema } from '../output-schemas';

export const wooCreateOrder = createAction({
  name: 'Create Order',
  classification: 'WRITE',
  displayName: 'Create Order',
  description: 'Create an order with one or more line items',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a new order in a WooCommerce store from a list of product IDs and quantities, with an optional customer, status, and billing email. Use when an agent needs to place an order on a customer behalf. Not idempotent: each call creates a separate order.',
    idempotent: false,
  },
  auth: wooAuth,
  outputSchema: createOrderOutputSchema,
  props: {
    line_items: Property.Array({
      displayName: 'Line Items',
      description: 'Products to include in the order',
      required: true,
      properties: {
        product_id: Property.ShortText({
          displayName: 'Product ID',
          required: true,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          required: true,
          defaultValue: 1,
        }),
      },
    }),
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Leave empty for a guest order',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Status the order is created with',
      required: false,
      options: {
        options: [
          { label: 'Pending', value: 'pending' },
          { label: 'Processing', value: 'processing' },
          { label: 'On hold', value: 'on-hold' },
          { label: 'Completed', value: 'completed' },
        ],
      },
    }),
    billing_email: Property.ShortText({
      displayName: 'Billing Email',
      description: 'Email address for the order',
      required: false,
    }),
    payment_method_title: Property.ShortText({
      displayName: 'Payment Method Title',
      description: 'Human-readable payment method, e.g. Direct bank transfer',
      required: false,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.props.baseUrl.replace(/\/$/, '');
    const { line_items, customer_id, status, billing_email, payment_method_title } =
      configValue.propsValue;

    const body: Record<string, unknown> = {
      line_items: line_items.map((item) => {
        const entry = Object(item);
        return {
          product_id: Number(entry['product_id']),
          quantity: Number(entry['quantity']),
        };
      }),
    };
    if (customer_id) {
      body['customer_id'] = Number(customer_id);
    }
    if (status) {
      body['status'] = status;
    }
    if (billing_email) {
      body['billing'] = { email: billing_email };
    }
    if (payment_method_title) {
      body['payment_method_title'] = payment_method_title;
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${trimmedBaseUrl}/wp-json/wc/v3/orders`,
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
