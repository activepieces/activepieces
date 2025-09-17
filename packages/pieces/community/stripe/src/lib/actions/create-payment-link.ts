import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeCreatePaymentLink = createAction({
    name: 'create_payment_link',
    auth: stripeAuth,
    displayName: 'Create Payment Link',
    description: 'Create a Payment Link for customers to pay via Stripe without needing checkout session flows.',
    props: {
        line_items: Property.Array({
            displayName: 'Line Items',
            description: 'The products and quantities to include in the payment link.',
            required: true,
            properties: {
                price: Property.ShortText({
                    displayName: 'Price ID',
                    description: "The ID of the price object (e.g., price_1J2X3Y4Z...). Find this in your Stripe Dashboard under Products.",
                    required: true,
                }),
                quantity: Property.Number({
                    displayName: 'Quantity',
                    required: true,
                    defaultValue: 1,
                }),
            },
        }),
        after_completion_type: Property.StaticDropdown({
            displayName: 'After Completion Behavior',
            description: "Controls the behavior after the purchase is complete. Defaults to showing Stripe's hosted confirmation page.",
            required: false,
            options: {
                options: [
                    { label: 'Show Confirmation Page', value: 'hosted_confirmation' },
                    { label: 'Redirect to URL', value: 'redirect' },
                ]
            }
        }),
        after_completion_redirect_url: Property.ShortText({
            displayName: 'Redirect URL',
            description: 'The URL to redirect the customer to after a successful purchase. Only used if the behavior is set to "Redirect to URL".',
            required: false,
        }),
    },
    async run(context) {
        const { line_items, after_completion_type, after_completion_redirect_url } = context.propsValue;

        const body: Record<string, unknown> = {};

        // Format line_items for the Stripe API's form-urlencoded format
        if (line_items && Array.isArray(line_items)) {
            line_items.forEach((item, index) => {
                const typedItem = item as { price: string; quantity: number };
                body[`line_items[${index}][price]`] = typedItem.price;
                body[`line_items[${index}][quantity]`] = typedItem.quantity;
            });
        }

        // Format after_completion for the Stripe API
        if (after_completion_type) {
            body['after_completion[type]'] = after_completion_type;
            if (after_completion_type === 'redirect' && after_completion_redirect_url) {
                body['after_completion[redirect][url]'] = after_completion_redirect_url;
            }
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${stripeCommon.baseUrl}/payment_links`,
            headers: {
                'Authorization': 'Bearer ' + context.auth,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body,
        });

        return response.body;
    },
});