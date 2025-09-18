// src/actions/cancel-subscription.ts

import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

import { subscriptionIdDropdown, customerIdDropdown } from '../common';

export const stripeCancelSubscription = createAction({
    name: 'cancel_subscription',
    auth: stripeAuth,
    displayName: 'Cancel Subscription',
    description: 'Cancel an existing subscription (immediately or at period end).',
    props: {
        // NOTE: The subscription dropdown now depends on a customer being selected first.
        customer: customerIdDropdown,
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

        // MAJOR FIX: The Stripe API uses different HTTP methods for immediate
        // vs. delayed cancellation. This logic now handles that correctly.
        let request: HttpRequest;

        const commonHeaders = {
            'Authorization': 'Bearer ' + context.auth,
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        if (at_period_end) {
            // To cancel at the end of the period, you UPDATE the subscription.
            request = {
                method: HttpMethod.POST,
                url: `${stripeCommon.baseUrl}/subscriptions/${subscription}`,
                headers: commonHeaders,
                body: {
                    cancel_at_period_end: true,
                },
            };
        } else {
            // To cancel immediately, you DELETE the subscription.
            request = {
                method: HttpMethod.DELETE,
                url: `${stripeCommon.baseUrl}/subscriptions/${subscription}`,
                headers: commonHeaders,
                // No body is needed for a DELETE request
            };
        }
        
        const response = await httpClient.sendRequest(request);
        return response.body;
    },
});