import { createAction, Property } from '@activepieces/pieces-framework';
import { ShippoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createOrder = createAction({
  auth: ShippoAuth,
  name: 'createOrder',
  displayName: 'Create Order',
  description: 'Creates a new order in Shippo with the required fields (to_address and placed_at).',

  props: {

    to_name: Property.ShortText({ displayName: 'Recipient Name', required: true }),
    to_company: Property.ShortText({ displayName: 'Company', required: false }),
    to_street1: Property.ShortText({ displayName: 'Street 1', required: true }),
    to_city: Property.ShortText({ displayName: 'City', required: true }),
    to_state: Property.ShortText({ displayName: 'State/Province', required: false }),
    to_zip: Property.ShortText({ displayName: 'ZIP/Postal Code', required: false }),
    to_country: Property.ShortText({ displayName: 'Country (ISO 2-code)', required: false }),
    to_email: Property.ShortText({ displayName: 'Email', required: false }),
    to_phone: Property.ShortText({ displayName: 'Phone', required: false }),


    placed_at: Property.DateTime({
      displayName: 'Placed At',
      description: 'Date and time when the order was placed',
      required: true,
    }),
    order_number: Property.ShortText({
      displayName: 'Order Number',
      required: false
    }),
    order_status: Property.StaticDropdown({
      displayName: 'Order Status',
      required: true,
      options: {
        options: [
          { label: 'PAID', value: 'PAID' },
          { label: 'UNPAID', value: 'UNPAID' },
          { label: 'CANCELLED', value: 'CANCELLED' },
          { label: 'SHIPPED', value: 'SHIPPED' },
          { label: 'UNKNOWN', value: 'UNKNOWN' },
          { label: 'AWAITPAY', value: 'AWAITPAY' },
          { label: 'REFUNDED', value: 'REFUNDED' },
          { label: 'PARTIALLY_FULFILLED', value: 'PARTIALLY_FULFILLED' },
        ],
      }
    }),

   
    shipping_cost: Property.Number({
      displayName: 'Shipping Cost',
      required: false,
    }),

    shipping_cost_currency: Property.StaticDropdown({
      displayName: 'Shipping Currency',
      required: true,
      options: {
        options: [
          { label: 'USD', value: 'USD' },
          { label: 'EUR', value: 'EUR' },
          { label: 'GBP', value: 'GBP' },
          { label: 'CAD', value: 'CAD' },
          { label: 'AUD', value: 'AUD' },
        ],
      },
    }),

    shipping_method: Property.ShortText({
      displayName: 'Shipping Method',
      required: false,
    }),

    subtotal_price: Property.Number({
      displayName: 'Subtotal Price',
      required: false,
    }),

    total_price: Property.Number({
      displayName: 'Total Price',
      required: false,
    }),

    total_tax: Property.Number({
      displayName: 'Total Tax',
      required: false,
    }),

    currency: Property.StaticDropdown({
      displayName: 'Currency',
      required: true,
      options: {
        options: [
          { label: 'USD', value: 'USD' },
          { label: 'EUR', value: 'EUR' },
          { label: 'GBP', value: 'GBP' },
          { label: 'CAD', value: 'CAD' },
          { label: 'AUD', value: 'AUD' },
        ],
      },
    }),

    weight: Property.Number({
      displayName: 'Weight',
      required: true,
    }),

    weight_unit: Property.StaticDropdown({
      displayName: 'Weight Unit',
      required: true,
      options: {
        options: [
          { label: 'Pound (lb)', value: 'lb' },
          { label: 'Ounce (oz)', value: 'oz' },
          { label: 'Gram (g)', value: 'g' },
          { label: 'Kilogram (kg)', value: 'kg' },
        ],
      },
    }),

  },

  async run(context) {
    const auth = context.auth as string;

    const to_address = {
      name: context.propsValue.to_name,
      company: context.propsValue.to_company,
      street1: context.propsValue.to_street1,
      city: context.propsValue.to_city,
      state: context.propsValue.to_state,
      zip: context.propsValue.to_zip,
      country: context.propsValue.to_country,
      email: context.propsValue.to_email,
      phone: context.propsValue.to_phone,
    };

    const body: any = {
      to_address,
      placed_at: context.propsValue.placed_at,
    
    };

    if (context.propsValue.order_number) {
      body.order_number = context.propsValue.order_number;
    }
    if (context.propsValue.order_status) {
      body.order_status = context.propsValue.order_status;
    }
    if (context.propsValue.shipping_cost) {
      body.shipping_cost = context.propsValue.shipping_cost;
    }
    if (context.propsValue.shipping_cost_currency) {
      body.shipping_cost_currency = context.propsValue.shipping_cost_currency;
    }
    if (context.propsValue.shipping_method) {
      body.shipping_method = context.propsValue.shipping_method;
    }
    if (context.propsValue.subtotal_price) {
      body.subtotal_price = context.propsValue.subtotal_price;
    }
    if (context.propsValue.total_price) {
      body.total_price = context.propsValue.total_price;
    }
    if (context.propsValue.total_tax) {
      body.total_tax = context.propsValue.total_tax;
    }
    if (context.propsValue.currency) {
      body.currency = context.propsValue.currency;
    }
    if (context.propsValue.weight) {
      body.weight = context.propsValue.weight;
    }
    if (context.propsValue.weight_unit) {
      body.weight_unit = context.propsValue.weight_unit;
    }

    const response = await makeRequest(
      auth,
      HttpMethod.POST,
      '/orders/',
      body
    );
    return response;
  },
});
