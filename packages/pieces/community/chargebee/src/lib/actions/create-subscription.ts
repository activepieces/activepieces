import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { chargebeeAuth } from '../auth';
import { chargebeeRequest, cleanObject } from '../common/client';

export const createSubscription = createAction({
  name: 'create_subscription',
  auth: chargebeeAuth,
  displayName: 'Create Subscription',
  description:
    'Create a subscription for an existing customer using a Chargebee item price.',
  props: {
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      required: true,
    }),
    item_price_id: Property.ShortText({
      displayName: 'Item Price ID',
      description: 'The Chargebee item price ID to subscribe the customer to.',
      required: true,
    }),
    quantity: Property.Number({
      displayName: 'Quantity',
      required: false,
    }),
    auto_collection: Property.StaticDropdown({
      displayName: 'Auto Collection',
      description:
        'Whether to automatically charge the customer. Defaults to the customer setting.',
      required: false,
      options: {
        options: [
          { label: 'On', value: 'on' },
          { label: 'Off', value: 'off' },
        ],
      },
    }),
    billing_cycles: Property.Number({
      displayName: 'Billing Cycles',
      description:
        'Number of billing cycles before the subscription ends. Defaults to the item price setting.',
      required: false,
    }),
    trial_end: Property.Number({
      displayName: 'Trial End (Unix Seconds)',
      description:
        'UTC timestamp in seconds when the trial period ends. Set to 0 for no trial.',
      required: false,
    }),
    start_date: Property.Number({
      displayName: 'Start Date (Unix Seconds)',
      description:
        'UTC timestamp in seconds when the subscription starts. Defaults to now. Provide a past value to backdate.',
      required: false,
    }),
    coupon_ids: Property.ShortText({
      displayName: 'Coupon ID',
      description: 'A coupon ID or code to apply to this subscription.',
      required: false,
    }),
    po_number: Property.ShortText({
      displayName: 'PO Number',
      description: 'Purchase order number to associate with this subscription.',
      required: false,
    }),
    invoice_notes: Property.LongText({
      displayName: 'Invoice Notes',
      description:
        'Customer-facing note added to all invoices for this subscription.',
      required: false,
    }),
    payment_source_id: Property.ShortText({
      displayName: 'Payment Source ID',
      description:
        'ID of the payment source to attach to this subscription.',
      required: false,
    }),
    invoice_immediately: Property.Checkbox({
      displayName: 'Invoice Immediately',
      description:
        'Invoice any charges raised at creation time immediately rather than adding them to unbilled charges.',
      required: false,
    }),
    net_term_days: Property.Number({
      displayName: 'Net Term Days',
      description:
        'Number of days within which invoices for this subscription must be paid (Net D). Must match a value configured in Chargebee.',
      required: false,
    }),
    meta_data: Property.Object({
      displayName: 'Metadata',
      description:
        'Key-value pairs to store extra information on the subscription.',
      required: false,
    }),
  },
  async run(context) {
    const {
      customer_id,
      item_price_id,
      quantity,
      auto_collection,
      billing_cycles,
      trial_end,
      start_date,
      coupon_ids,
      po_number,
      invoice_notes,
      payment_source_id,
      invoice_immediately,
      net_term_days,
      meta_data,
    } = context.propsValue;

    const body = cleanObject({
      auto_collection,
      billing_cycles,
      trial_end,
      start_date,
      'coupon_ids[0]': coupon_ids,
      po_number,
      invoice_notes,
      payment_source_id,
      invoice_immediately,
      net_term_days,
      meta_data: meta_data ? JSON.stringify(meta_data) : undefined,
      'subscription_items[item_price_id][0]': item_price_id,
      'subscription_items[quantity][0]': quantity,
    });

    return await chargebeeRequest({
      site: context.auth.props.site,
      apiKey: context.auth.props.api_key,
      method: HttpMethod.POST,
      path: `/customers/${customer_id}/subscription_for_items`,
      contentType: 'application/x-www-form-urlencoded',
      body,
    });
  },
});
