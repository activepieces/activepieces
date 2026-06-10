import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { qawafelAuth } from '../common/auth';
import { qawafelApiCall } from '../common/client';
import { OrderLineItemInput, qawafelProps } from '../common/props';

export const createOrder = createAction({
  auth: qawafelAuth,
  name: 'create_order',
  displayName: 'Create Completed Order',
  description:
    'Sync a completed (fulfilled) order into Qawafel. Use this to import historical or externally-completed orders from another storefront, ERP, or B2B portal — the order is created directly in **Fulfilled** state and skips the normal fulfilment workflow. Do **not** use this for new orders that still need to be confirmed, picked, and delivered.',
  props: {
    merchant_id: qawafelProps.merchantDropdown({
      displayName: 'Customer',
      description:
        'The customer placing the order. Pick from your existing customer merchants — use "Create Merchant" first if they are new.',
      required: true,
      type: 'customer',
    }),
    line_items: qawafelProps.orderLineItemsArray,
    address_line: Property.ShortText({
      displayName: 'Delivery Address — Street',
      description: 'Street address line for delivery.',
      required: true,
    }),
    city: Property.ShortText({
      displayName: 'Delivery Address — City',
      required: true,
    }),
    postal_code: Property.ShortText({
      displayName: 'Delivery Address — Postal Code',
      description: 'Postal code (5 digits in Saudi Arabia).',
      required: true,
    }),
    country: Property.ShortText({
      displayName: 'Delivery Address — Country',
      description:
        'ISO 3166-1 alpha-2 country code, e.g. `SA` for Saudi Arabia, `AE` for the UAE.',
      required: true,
      defaultValue: 'SA',
    }),
    district: Property.ShortText({
      displayName: 'Delivery Address — District',
      description: 'Optional. Neighborhood or district name.',
      required: false,
    }),
    region: Property.ShortText({
      displayName: 'Delivery Address — Region',
      description: 'Optional. Province or region name.',
      required: false,
    }),
    short_address: Property.ShortText({
      displayName: 'Saudi Short Address',
      description:
        'Optional. The Saudi National Address short code (4 uppercase letters + 4 digits, e.g. `RHRA1234`).',
      required: false,
    }),
    delivery_option: Property.StaticDropdown<'vendor' | 'courier'>({
      displayName: 'Delivery Method',
      description:
        'Pick **Vendor** if you (the seller) deliver yourself, or **Courier** to use a delivery service.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Vendor (you deliver)', value: 'vendor' },
          { label: 'Courier (third-party)', value: 'courier' },
        ],
      },
    }),
    delivery_fees: Property.ShortText({
      displayName: 'Delivery Fees (SAR)',
      description:
        'Optional. Delivery fees as a decimal string, e.g. `15.00`. Required if you set a delivery method.',
      required: false,
    }),
    delivery_fees_payer: Property.StaticDropdown<'customer' | 'vendor'>({
      displayName: 'Who Pays Delivery',
      description:
        'Required if you set a delivery method. Pick **Customer** to bill the buyer, or **Vendor** to absorb the fee.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Customer pays', value: 'customer' },
          { label: 'Vendor pays', value: 'vendor' },
        ],
      },
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Optional. Internal notes attached to the order.',
      required: false,
    }),
    external_ref: qawafelProps.externalRef('Your Reference ID'),
    idempotency_key: qawafelProps.idempotencyKey,
  },
  async run({ auth, propsValue }) {
    const lineItems = (propsValue.line_items ?? []) as OrderLineItemInput[];

    const address: Record<string, unknown> = {
      address_line: propsValue.address_line,
      city: propsValue.city,
      postal_code: propsValue.postal_code,
      country: propsValue.country,
    };
    if (propsValue.district) {
      address['district'] = propsValue.district;
    }
    if (propsValue.region) {
      address['region'] = propsValue.region;
    }
    if (propsValue.short_address) {
      address['short_address'] = propsValue.short_address;
    }

    const delivery: Record<string, unknown> = {};
    if (propsValue.delivery_option) {
      delivery['delivery_option'] = propsValue.delivery_option;
    }
    if (propsValue.delivery_fees) {
      delivery['delivery_fees'] = propsValue.delivery_fees;
    }
    if (propsValue.delivery_fees_payer) {
      delivery['delivery_fees_payer'] = propsValue.delivery_fees_payer;
    }

    const body: Record<string, unknown> = {
      merchant_id: propsValue.merchant_id,
      line_items: lineItems,
      address,
    };
    if (Object.keys(delivery).length > 0) {
      body['delivery'] = delivery;
    }
    if (propsValue.notes) {
      body['notes'] = propsValue.notes;
    }
    if (propsValue.external_ref) {
      body['external_ref'] = propsValue.external_ref;
    }

    const response = await qawafelApiCall({
      auth,
      method: HttpMethod.POST,
      path: '/orders',
      body,
      idempotencyKey: propsValue.idempotency_key,
    });
    return response.body;
  },
});
