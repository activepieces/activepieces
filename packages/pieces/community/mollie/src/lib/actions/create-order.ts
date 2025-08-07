import { createAction, Property } from '@activepieces/pieces-framework';
import { mollieAuth } from '../common/common';
import { MollieApi } from '../common/common';

export const createOrderAction = createAction({
  auth: mollieAuth,
  name: 'create_order',
  displayName: 'Create Order',
  description: 'Create a new order in Mollie',
  props: {
    amount: Property.Number({
      displayName: 'Total Amount',
      description: 'Total order amount',
      required: true,
    }),
    currency: Property.StaticDropdown({
      displayName: 'Currency',
      required: true,
      defaultValue: 'EUR',
      options: {
        options: [
          { label: 'EUR', value: 'EUR' },
          { label: 'USD', value: 'USD' },
          { label: 'GBP', value: 'GBP' },
        ],
      },
    }),
    orderNumber: Property.ShortText({
      displayName: 'Order Number',
      description: 'Your internal order number',
      required: true,
    }),
    lines: Property.Array({
      displayName: 'Order Lines',
      description: 'Array of order line items',
      required: true,
    }),
    billingAddress: Property.Object({
      displayName: 'Billing Address',
      description: 'Customer billing address',
      required: true,
    }),
    shippingAddress: Property.Object({
      displayName: 'Shipping Address',
      description: 'Customer shipping address',
      required: false,
    }),
    redirectUrl: Property.ShortText({
      displayName: 'Redirect URL',
      required: false,
    }),
    webhookUrl: Property.ShortText({
      displayName: 'Webhook URL',
      required: false,
    }),
  },
  async run(context) {
    const api = new MollieApi({ apiKey: context.auth });
    
    const orderData = {
      amount: {
        currency: context.propsValue.currency,
        value: context.propsValue.amount.toFixed(2),
      },
      orderNumber: context.propsValue.orderNumber,
      lines: context.propsValue.lines,
      billingAddress: context.propsValue.billingAddress,
      shippingAddress: context.propsValue.shippingAddress,
      redirectUrl: context.propsValue.redirectUrl,
      webhookUrl: context.propsValue.webhookUrl,
    };

    return await api.createOrder(orderData);
  },
});