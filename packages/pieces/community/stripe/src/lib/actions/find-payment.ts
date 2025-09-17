import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeFindPayment = createAction({
    name: 'find_payment',
    auth: stripeAuth,
    displayName: 'Find Payment',
    description: 'Find a Payment Intent or a Charge by its ID.',
    props: {
        payment_type: Property.StaticDropdown({
            displayName: 'Payment Type',
            description: 'Select whether to find a Payment Intent or a Charge.',
            required: true,
            options: {
                options: [
                    { label: "Payment Intent", value: "payment_intent" },
                    { label: "Charge", value: "charge" },
                ]
            }
        }),
        payment_id: Property.ShortText({
            displayName: 'Payment ID',
            description: 'The ID of the Payment Intent (e.g., pi_...) or Charge (e.g., ch_...).',
            required: true,
        }),
    },
    async run(context) {
        const { payment_type, payment_id } = context.propsValue;
        
        let url = '';
        if (payment_type === 'payment_intent') {
            url = `${stripeCommon.baseUrl}/payment_intents/${payment_id}`;
        } else {
            url = `${stripeCommon.baseUrl}/charges/${payment_id}`;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: url,
            headers: {
                'Authorization': 'Bearer ' + context.auth,
            },
        });

        return response.body;
    },
});