import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';
// CHANGED: Import the specific dropdown you need
import { customerIdDropdown } from '../common/props';

export const stripeCreateSubscription = createAction({
    name: 'create_subscription',
    auth: stripeAuth,
    displayName: 'Create Subscription',
    description: 'Start a subscription for a customer with specified items/prices.',
    props: {
        // CHANGED: Use the imported dropdown directly
        customer: customerIdDropdown,
        items: Property.Array({
            displayName: 'Subscription Items',
            description: 'A list of prices to subscribe the customer to.',
            required: true,
            properties: {
                price: Property.ShortText({
                    displayName: 'Price ID',
                    description: "The ID of the price object (e.g., price_1Oa...). You can find this in your Stripe Dashboard under Products.",
                    required: true
                }),
                quantity: Property.Number({
                    displayName: 'Quantity',
                    required: false,
                    defaultValue: 1
                }),
            },
        }),
        collection_method: Property.StaticDropdown({
            displayName: 'Collection Method',
            description: "How to collect payment for the subscription. Defaults to 'charge_automatically'.",
            required: false,
            options: {
                options: [
                    { label: 'Charge Automatically', value: 'charge_automatically' },
                    { label: 'Send Invoice', value: 'send_invoice' },
                ]
            }
        }),
        days_until_due: Property.Number({
            displayName: 'Days Until Due',
            description: 'The number of days an invoice is past due before it is automatically voided. Only used when Collection Method is "Send Invoice".',
            required: false,
        }),
        trial_period_days: Property.Number({
            displayName: 'Trial Period (Days)',
            required: false,
        }),
        coupon: Property.ShortText({
            displayName: 'Coupon ID',
            description: 'The code of the coupon to apply to this subscription.',
            required: false,
        }),
        automatic_tax_enabled: Property.Checkbox({
            displayName: 'Enable Automatic Tax',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        const { items, ...props } = context.propsValue;

        const body: Record<string, unknown> = { ...props };

        // Handle items array for the Stripe API
        if (items && Array.isArray(items)) {
            items.forEach((item, index) => {
                const typedItem = item as { price: string; quantity?: number };
                body[`items[${index}][price]`] = typedItem.price;
                if (typedItem.quantity !== undefined) {
                    body[`items[${index}][quantity]`] = typedItem.quantity;
                }
            });
        }

        // Handle automatic_tax[enabled] nested property
        if (props.automatic_tax_enabled !== undefined) {
            body['automatic_tax[enabled]'] = props.automatic_tax_enabled;
            delete body.automatic_tax_enabled; // remove top-level prop
        }

        // Remove undefined values to avoid errors
        Object.keys(body).forEach(key => (body[key] === undefined) && delete body[key]);

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${stripeCommon.baseUrl}/subscriptions`,
            headers: {
                'Authorization': 'Bearer ' + context.auth,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body,
        });

        return response.body;
    },
});