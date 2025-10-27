import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { shippoAuth } from '../..';
import { shippoCommon } from '../common/client';

export const createOrderAction = createAction({
  auth: shippoAuth,
  name: 'create_order',
  displayName: 'Create Order',
  description: 'Creates a new order in Shippo',
  props: {
    orderNumber: Property.ShortText({
      displayName: 'Order Number',
      description: 'Your internal order number',
      required: true,
    }),
    placedAt: Property.DateTime({
      displayName: 'Placed At',
      description: 'Date and time when the order was placed',
      required: false,
    }),
    orderStatus: Property.StaticDropdown({
      displayName: 'Order Status',
      description: 'Current status of the order',
      required: false,
      defaultValue: 'PAID',
      options: {
        options: [
          { label: 'Paid', value: 'PAID' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Refunded', value: 'REFUNDED' },
          { label: 'Partially Refunded', value: 'PARTIALLY_REFUNDED' },
        ],
      },
    }),
    toName: Property.ShortText({
      displayName: 'Recipient Name',
      description: 'Name of the recipient',
      required: true,
    }),
    toStreet1: Property.ShortText({
      displayName: 'Recipient Street Address',
      required: true,
    }),
    toCity: Property.ShortText({
      displayName: 'Recipient City',
      required: true,
    }),
    toState: Property.ShortText({
      displayName: 'Recipient State',
      required: true,
    }),
    toZip: Property.ShortText({
      displayName: 'Recipient ZIP Code',
      required: true,
    }),
    toCountry: Property.ShortText({
      displayName: 'Recipient Country',
      description: 'Two-letter country code (e.g., US)',
      required: true,
      defaultValue: 'US',
    }),
    toPhone: Property.ShortText({
      displayName: 'Recipient Phone',
      required: false,
    }),
    toEmail: Property.ShortText({
      displayName: 'Recipient Email',
      required: false,
    }),
    fromName: Property.ShortText({
      displayName: 'Sender Name',
      required: true,
    }),
    fromStreet1: Property.ShortText({
      displayName: 'Sender Street Address',
      required: true,
    }),
    fromCity: Property.ShortText({
      displayName: 'Sender City',
      required: true,
    }),
    fromState: Property.ShortText({
      displayName: 'Sender State',
      required: true,
    }),
    fromZip: Property.ShortText({
      displayName: 'Sender ZIP Code',
      required: true,
    }),
    fromCountry: Property.ShortText({
      displayName: 'Sender Country',
      description: 'Two-letter country code (e.g., US)',
      required: true,
      defaultValue: 'US',
    }),
    fromPhone: Property.ShortText({
      displayName: 'Sender Phone',
      required: false,
    }),
    fromEmail: Property.ShortText({
      displayName: 'Sender Email',
      required: false,
    }),
    itemTitle: Property.ShortText({
      displayName: 'Item Title',
      required: true,
    }),
    itemQuantity: Property.Number({
      displayName: 'Item Quantity',
      required: true,
      defaultValue: 1,
    }),
    itemPrice: Property.ShortText({
      displayName: 'Item Price',
      description: 'Total price as string (e.g., "12.99")',
      required: true,
    }),
    itemWeight: Property.ShortText({
      displayName: 'Item Weight',
      description: 'Weight value (e.g., "1.5")',
      required: true,
    }),
    itemWeightUnit: Property.StaticDropdown({
      displayName: 'Weight Unit',
      required: true,
      defaultValue: 'lb',
      options: {
        options: [
          { label: 'Pounds (lb)', value: 'lb' },
          { label: 'Ounces (oz)', value: 'oz' },
          { label: 'Kilograms (kg)', value: 'kg' },
          { label: 'Grams (g)', value: 'g' },
        ],
      },
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Three-letter currency code (e.g., USD)',
      required: true,
      defaultValue: 'USD',
    }),
    shippingMethod: Property.ShortText({
      displayName: 'Shipping Method',
      description: 'Shipping method (e.g., USPS Priority, FedEx Ground)',
      required: false,
    }),
    shippingCost: Property.ShortText({
      displayName: 'Shipping Cost',
      description: 'Shipping cost as string (e.g., "5.99")',
      required: false,
    }),
    shippingCostCurrency: Property.ShortText({
      displayName: 'Shipping Cost Currency',
      description: 'Three-letter currency code for shipping cost',
      required: false,
      defaultValue: 'USD',
    }),
    weight: Property.ShortText({
      displayName: 'Total Package Weight',
      description: 'Total weight of the package (e.g., "2.5")',
      required: true,
    }),
    weightUnit: Property.StaticDropdown({
      displayName: 'Package Weight Unit',
      description: 'Unit for total package weight',
      required: true,
      defaultValue: 'lb',
      options: {
        options: [
          { label: 'Pounds (lb)', value: 'lb' },
          { label: 'Ounces (oz)', value: 'oz' },
          { label: 'Kilograms (kg)', value: 'kg' },
          { label: 'Grams (g)', value: 'g' },
        ],
      },
    }),
  },
  async run(context) {
    const toAddress: any = {
      name: context.propsValue.toName,
      street1: context.propsValue.toStreet1,
      city: context.propsValue.toCity,
      state: context.propsValue.toState,
      zip: context.propsValue.toZip,
      country: context.propsValue.toCountry,
    };

    if (context.propsValue.toPhone) {
      toAddress.phone = context.propsValue.toPhone;
    }
    if (context.propsValue.toEmail) {
      toAddress.email = context.propsValue.toEmail;
    }

    const fromAddress: any = {
      name: context.propsValue.fromName,
      street1: context.propsValue.fromStreet1,
      city: context.propsValue.fromCity,
      state: context.propsValue.fromState,
      zip: context.propsValue.fromZip,
      country: context.propsValue.fromCountry,
    };

    if (context.propsValue.fromPhone) {
      fromAddress.phone = context.propsValue.fromPhone;
    }
    if (context.propsValue.fromEmail) {
      fromAddress.email = context.propsValue.fromEmail;
    }

    const orderData: any = {
      order_number: context.propsValue.orderNumber,
      placed_at: context.propsValue.placedAt || new Date().toISOString(),
      order_status: context.propsValue.orderStatus || 'PAID',
      to_address: toAddress,
      from_address: fromAddress,
      line_items: [
        {
          title: context.propsValue.itemTitle,
          quantity: context.propsValue.itemQuantity,
          total_price: context.propsValue.itemPrice,
          currency: context.propsValue.currency,
          weight: context.propsValue.itemWeight,
          weight_unit: context.propsValue.itemWeightUnit,
        },
      ],
      weight: context.propsValue.weight,
      weight_unit: context.propsValue.weightUnit,
    };

    if (context.propsValue.shippingMethod) {
      orderData.shipping_method = context.propsValue.shippingMethod;
    }
    if (context.propsValue.shippingCost) {
      orderData.shipping_cost = context.propsValue.shippingCost;
      orderData.shipping_cost_currency = context.propsValue.shippingCostCurrency || 'USD';
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${shippoCommon.baseUrl}/orders`,
      headers: {
        Authorization: `ShippoToken ${context.auth}`,
        'Content-Type': 'application/json',
      },
      body: orderData,
    });

    return response.body;
  },
});