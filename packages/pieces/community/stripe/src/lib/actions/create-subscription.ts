import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { customerIdDropdown } from '../common';

export const createSubscription = createAction({
  auth: stripeAuth,
  name: 'createSubscription',
  displayName: 'Create Subscription',
  description: 'Create a new subscription for a customer in Stripe.',
  props: {
    customer: customerIdDropdown,
    items: Property.Array({
      displayName: 'Subscription Items',
      required: true,
      description: 'List of prices and quantities for the subscription.',
      properties: {
        price: Property.ShortText({ displayName: 'Price ID', required: true }),
        quantity: Property.Number({ displayName: 'Quantity', required: false }),
      },
    }),
    collection_method: Property.StaticDropdown({
      displayName: 'Collection Method',
      description:
        "How to collect payment. 'charge_automatically' will try to bill the default payment method. 'send_invoice' will email an invoice.",
      required: false,
      options: {
        options: [
          { label: 'Charge Automatically', value: 'charge_automatically' },
          { label: 'Send Invoice', value: 'send_invoice' },
        ],
      },
    }),
    trial_period_days: Property.Number({
      displayName: 'Trial Period Days',
      required: false,
    }),
    proration_behavior: Property.ShortText({
      displayName: 'Proration Behavior',
      required: false,
      description: 'create_prorations, always_invoice, none',
    }),
    billing_cycle_anchor: Property.Number({
      displayName: 'Billing Cycle Anchor (timestamp)',
      required: false,
    }),
    coupon: Property.ShortText({
      displayName: 'Coupon ID',
      required: false,
    }),
    payment_behavior: Property.ShortText({
      displayName: 'Payment Behavior',
      required: false,
      description:
        'default_incomplete, error_if_incomplete, pending_if_incomplete',
    }),
    automatic_tax_enabled: Property.Checkbox({
      displayName: 'Enable Automatic Tax',
      required: false,
      defaultValue: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      required: false,
      description: 'Key-value pairs to attach to the subscription.',
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      customer,
      items,
      collection_method,
      trial_period_days,
      proration_behavior,
      billing_cycle_anchor,
      coupon,
      payment_behavior,
      automatic_tax_enabled,
      metadata,
      description,
    } = propsValue;

    const body: Record<string, any> = {
      customer,
      collection_method,
      trial_period_days,
      proration_behavior,
      billing_cycle_anchor,
      coupon,
      payment_behavior,
      description,
    };

    // Handle items array for Stripe API
    if (items && Array.isArray(items)) {
      items.forEach((item, idx) => {
        const typedItem = item as { price: string; quantity?: number };
        body[`items[${idx}][price]`] = typedItem.price;
        if (typedItem.quantity !== undefined) {
          body[`items[${idx}][quantity]`] = typedItem.quantity;
        }
      });
    }

    // Handle automatic_tax[enabled]
    if (automatic_tax_enabled !== undefined) {
      body['automatic_tax[enabled]'] = automatic_tax_enabled;
    }

    // Handle metadata
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        body[`metadata[${key}]`] = value;
      });
    }

    // Remove undefined values
    Object.keys(body).forEach(
      (key) => body[key] === undefined && delete body[key]
    );

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.stripe.com/v1/subscriptions',
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    return response.body;
  },
});
