// src/actions/cancel-subscription.ts

import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';
// CHANGED: Import the specific dropdown you need
import { subscriptionIdDropdown } from '../common/props';

export const stripeCancelSubscription = createAction({
    name: 'cancel_subscription',
    auth: stripeAuth,
    displayName: 'Cancel Subscription',
    description: 'Cancel an existing subscription (immediately or at period end).',
    props: {
        // CHANGED: Use the imported dropdown directly
        subscription: subscriptionIdDropdown,
        at_period_end: Property.Checkbox({
            displayName: 'Cancel at Period End',
            description: 'If checked, the subscription will remain active until the end of the current billing period. If unchecked, it will be canceled immediately.',
            required: false,
            defaultValue: true, 
        }),
    },
    async run(context) {
        const { subscription, at_period_end } = context.propsValue;

        const body: Record<string, unknown> = {
            cancel_at_period_end: at_period_end
        };

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST, // Stripe API uses POST to update/cancel subscriptions
            url: `${stripeCommon.baseUrl}/subscriptions/${subscription}`,
            headers: {
                'Authorization': 'Bearer ' + context.auth,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body,
        });

        return response.body;
    },
});