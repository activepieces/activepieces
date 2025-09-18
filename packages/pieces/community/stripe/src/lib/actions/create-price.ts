import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';
// CHANGED: Import the specific dropdown you need
import { productIdDropdown } from '../common/props';

export const stripeCreatePrice = createAction({
    name: 'create_price',
    auth: stripeAuth,
    displayName: 'Create Price',
    description: 'Create a price (one-time or recurring), associated with a product.',
    props: {
        // CHANGED: Use the imported dropdown directly
        product: productIdDropdown,
        amount: Property.Number({
            displayName: 'Amount',
            description: 'The price amount, for example, 25.00 for $25.00.',
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
        }),
        recurring: Property.StaticDropdown({
            displayName: "Billing Interval",
            description: "Set to 'One-Time' for a single payment, or a recurring interval for a subscription.",
            required: true,
            defaultValue: 'one_time',
            options: {
                options: [
                    { label: 'One-Time', value: 'one_time' },
                    { label: 'Daily', value: 'day' },
                    { label: 'Weekly', value: 'week' },
                    { label: 'Monthly', value: 'month' },
                    { label: 'Yearly', value: 'year' },
                ]
            }
        }),
        interval_count: Property.Number({
            displayName: 'Interval Count',
            description: 'The number of intervals between subscription billings (e.g., for billing every 3 months, set Interval to Monthly and Interval Count to 3). Only used for recurring prices.',
            required: false,
            defaultValue: 1,
        }),
    },
    async run(context) {
        const { product, amount, currency, recurring, interval_count } = context.propsValue;
        
        // Stripe requires the amount in the smallest currency unit (e.g., cents).
        const unitAmount = Math.round(amount * 100);

        const body: Record<string, unknown> = {
            product: product,
            unit_amount: unitAmount,
            currency: currency,
        };

        if (recurring !== 'one_time') {
            body['recurring[interval]'] = recurring;
            body['recurring[interval_count]'] = interval_count || 1;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${stripeCommon.baseUrl}/prices`,
            headers: {
                'Authorization': 'Bearer ' + context.auth,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body,
        });

        return response.body;
    },
});