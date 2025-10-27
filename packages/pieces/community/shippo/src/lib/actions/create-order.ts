import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { shippoAuth } from '../common/auth';
import { shippoCommon } from '../common/client';

export const createOrder = createAction({
    name: 'create_order',
    displayName: 'Create Order',
    description: 'Creates a new order in Shippo',
    auth: shippoAuth,
    props: {
        order_number: Property.ShortText({
            displayName: 'Order Number',
            description: 'Unique order number',
            required: true,
        }),
        order_status: Property.StaticDropdown({
            displayName: 'Order Status',
            description: 'Status of the order',
            required: true,
            options: {
                options: [
                    { label: 'PAID', value: 'PAID' },
                    { label: 'PENDING', value: 'PENDING' },
                    { label: 'CANCELLED', value: 'CANCELLED' },
                    { label: 'REFUNDED', value: 'REFUNDED' },
                ]
            }
        }),
        placed_at: Property.DateTime({
            displayName: 'Placed At',
            description: 'When the order was placed',
            required: true,
        }),
        to_address_name: Property.ShortText({
            displayName: 'To Address - Name',
            description: 'Recipient name',
            required: true,
        }),
        to_address_company: Property.ShortText({
            displayName: 'To Address - Company',
            description: 'Recipient company',
            required: false,
        }),
        to_address_street1: Property.ShortText({
            displayName: 'To Address - Street 1',
            description: 'Recipient street address',
            required: true,
        }),
        to_address_street2: Property.ShortText({
            displayName: 'To Address - Street 2',
            description: 'Recipient street address line 2',
            required: false,
        }),
        to_address_city: Property.ShortText({
            displayName: 'To Address - City',
            description: 'Recipient city',
            required: true,
        }),
        to_address_state: Property.ShortText({
            displayName: 'To Address - State',
            description: 'Recipient state/province',
            required: true,
        }),
        to_address_zip: Property.ShortText({
            displayName: 'To Address - ZIP',
            description: 'Recipient postal code',
            required: true,
        }),
        to_address_country: Property.ShortText({
            displayName: 'To Address - Country',
            description: 'Recipient country code (e.g., US, CA)',
            required: true,
        }),
        to_address_phone: Property.ShortText({
            displayName: 'To Address - Phone',
            description: 'Recipient phone number',
            required: false,
        }),
        to_address_email: Property.ShortText({
            displayName: 'To Address - Email',
            description: 'Recipient email address',
            required: false,
        }),
        from_address_name: Property.ShortText({
            displayName: 'From Address - Name',
            description: 'Sender name',
            required: true,
        }),
        from_address_company: Property.ShortText({
            displayName: 'From Address - Company',
            description: 'Sender company',
            required: false,
        }),
        from_address_street1: Property.ShortText({
            displayName: 'From Address - Street 1',
            description: 'Sender street address',
            required: true,
        }),
        from_address_street2: Property.ShortText({
            displayName: 'From Address - Street 2',
            description: 'Sender street address line 2',
            required: false,
        }),
        from_address_city: Property.ShortText({
            displayName: 'From Address - City',
            description: 'Sender city',
            required: true,
        }),
        from_address_state: Property.ShortText({
            displayName: 'From Address - State',
            description: 'Sender state/province',
            required: true,
        }),
        from_address_zip: Property.ShortText({
            displayName: 'From Address - ZIP',
            description: 'Sender postal code',
            required: true,
        }),
        from_address_country: Property.ShortText({
            displayName: 'From Address - Country',
            description: 'Sender country code (e.g., US, CA)',
            required: true,
        }),
        from_address_phone: Property.ShortText({
            displayName: 'From Address - Phone',
            description: 'Sender phone number',
            required: false,
        }),
        from_address_email: Property.ShortText({
            displayName: 'From Address - Email',
            description: 'Sender email address',
            required: false,
        }),
        line_items: Property.LongText({
            displayName: 'Line Items (JSON)',
            description: 'JSON array of line items. Example: [{"title": "Product A", "sku": "PROD-A-001", "quantity": 2, "total_price": "29.99", "unit_price": "14.99", "weight": "0.5", "weight_unit": "lb"}]',
            required: true,
        }),
        shipping_cost: Property.ShortText({
            displayName: 'Shipping Cost',
            description: 'Shipping cost amount',
            required: false,
        }),
        shipping_cost_currency: Property.ShortText({
            displayName: 'Shipping Cost Currency',
            description: 'Currency code for shipping cost (e.g., USD)',
            required: false,
        }),
        total_price: Property.ShortText({
            displayName: 'Total Price',
            description: 'Total order amount',
            required: true,
        }),
        total_price_currency: Property.ShortText({
            displayName: 'Total Price Currency',
            description: 'Currency code for total price (e.g., USD)',
            required: true,
        }),
        notes: Property.LongText({
            displayName: 'Notes',
            description: 'Additional notes for the order',
            required: false,
        }),
    },
    async run(context) {
        const {
            order_number,
            order_status,
            placed_at,
            to_address_name,
            to_address_company,
            to_address_street1,
            to_address_street2,
            to_address_city,
            to_address_state,
            to_address_zip,
            to_address_country,
            to_address_phone,
            to_address_email,
            from_address_name,
            from_address_company,
            from_address_street1,
            from_address_street2,
            from_address_city,
            from_address_state,
            from_address_zip,
            from_address_country,
            from_address_phone,
            from_address_email,
            line_items,
            shipping_cost,
            shipping_cost_currency,
            total_price,
            total_price_currency,
            notes
        } = context.propsValue;

        const body: any = {
            order_number,
            order_status,
            placed_at,
            to_address: {
                name: to_address_name,
                street1: to_address_street1,
                city: to_address_city,
                state: to_address_state,
                zip: to_address_zip,
                country: to_address_country,
            },
            from_address: {
                name: from_address_name,
                street1: from_address_street1,
                city: from_address_city,
                state: from_address_state,
                zip: from_address_zip,
                country: from_address_country,
            },
            line_items: JSON.parse(line_items),
            total_price,
            total_price_currency,
        };

        // Add optional fields
        if (to_address_company) body.to_address.company = to_address_company;
        if (to_address_street2) body.to_address.street2 = to_address_street2;
        if (to_address_phone) body.to_address.phone = to_address_phone;
        if (to_address_email) body.to_address.email = to_address_email;

        if (from_address_company) body.from_address.company = from_address_company;
        if (from_address_street2) body.from_address.street2 = from_address_street2;
        if (from_address_phone) body.from_address.phone = from_address_phone;
        if (from_address_email) body.from_address.email = from_address_email;

        if (shipping_cost) body.shipping_cost = shipping_cost;
        if (shipping_cost_currency) body.shipping_cost_currency = shipping_cost_currency;
        if (notes) body.notes = notes;

        const response = await shippoCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/orders',
            body,
        });

        return response.body;
    },
});
