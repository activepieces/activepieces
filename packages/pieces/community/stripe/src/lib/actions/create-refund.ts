import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';
import { stripeProps } from '../common/props';

export const stripeCreateRefund = createAction({
    name: 'create_refund',
    auth: stripeAuth,
    displayName: 'Create Refund',
    description: 'Create a full or partial refund for a charge.',
    props: {
        charge: stripeProps.charge(),
        amount: Property.Number({
            displayName: 'Amount',
            description: 'The amount to refund (e.g., 12.99). If left blank, a full refund will be issued.',
            required: false,
        }),
        reason: Property.StaticDropdown({
            displayName: 'Reason',
            description: 'An optional reason for the refund.',
            required: false,
            options: {
                options: [
                    { label: 'Duplicate', value: 'duplicate' },
                    { label: 'Fraudulent', value: 'fraudulent' },
                    { label: 'Requested by Customer', value: 'requested_by_customer' },
                ]
            }
        }),
    },
    async run(context) {
        const { charge, amount, reason } = context.propsValue;

        const body: Record<string, unknown> = {
            charge: charge,
        };

        if (amount !== undefined && amount !== null) {
            // Stripe requires the amount in the smallest currency unit (e.g., cents)
            body.amount = Math.round(amount * 100);
        }

        if (reason) {
            body.reason = reason;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${stripeCommon.baseUrl}/refunds`,
            headers: {
                'Authorization': 'Bearer ' + context.auth,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body,
        });

        return response.body;
    },
});