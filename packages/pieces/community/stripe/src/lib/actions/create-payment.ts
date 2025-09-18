import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';
// REMOVED: This import is no longer needed as stripeProps does not exist.

export const stripeCreatePayment = createAction({
    name: 'create_payment',
    auth: stripeAuth,
    displayName: 'Create Payment Link',
    description: 'Creates a shareable, Stripe-hosted payment link.',
    props: {
        name: Property.ShortText({
            displayName: 'Product Name',
            description: 'The name of the product or service being sold.',
            required: true,
        }),
        amount: Property.Number({
            displayName: 'Amount',
            description: 'The price of the product, for example, 15.50 for $15.50.',
            required: true,
        }),
        currency: Property.StaticDropdown({
            displayName: 'Currency',
            description: 'The three-letter ISO code for the currency.',
            required: true,
            options: {
                options: [
                    { label: "US Dollar", value: "usd" },
                    { label: "Indian Rupee", value: "inr" },
                    { label: "Euro", value: "eur" },
                    { label: "Pound Sterling", value: "gbp" },
                    { label: "Australian Dollar", value: "aud" },
                    { label: "Canadian Dollar", value: "cad" },
                    { label: "Swiss Franc", value: "chf" },
                    { label: "Chinese Yuan", value: "cny" },
                    { label: "Japanese Yen", value: "jpy" },
                    { label: "Singapore Dollar", value: "sgd" },
                ]
            }
        })
    },
    async run(context) {
        const { name, amount, currency } = context.propsValue;

        // Stripe requires the amount in the smallest currency unit (e.g., cents).
        const unitAmount = Math.round(amount * 100);

        // Stripe's API for Payment Links expects a form-urlencoded body.
        // We use bracket notation for nested objects like 'line_items' and 'price_data'.
        const body: Record<string, unknown> = {
            'line_items[0][price_data][currency]': currency,
            'line_items[0][price_data][product_data][name]': name,
            'line_items[0][price_data][unit_amount]': unitAmount,
            'line_items[0][quantity]': 1,
        };

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${stripeCommon.baseUrl}/payment_links`,
            headers: {
                'Authorization': 'Bearer ' + context.auth,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
        });

        return response.body;
    },
});