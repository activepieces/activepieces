// src/actions/deactivate_payment_link.ts (This is the corrected file)

import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';
// CHANGED: Import the specific dropdown you need
import { paymentLinkIdDropdown } from '../common/props';

export const stripeDeactivatePaymentLink = createAction({
    name: 'deactivate_payment_link',
    auth: stripeAuth,
    displayName: 'Deactivate Payment Link',
    description: 'Disable/deactivate a Payment Link so it can no longer be used.',
    props: {
        // CHANGED: Use the imported dropdown directly
        payment_link: paymentLinkIdDropdown,
    },
    async run(context) {
        const paymentLinkId = context.propsValue.payment_link;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${stripeCommon.baseUrl}/payment_links/${paymentLinkId}`,
            headers: {
                'Authorization': 'Bearer ' + context.auth,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: {
                active: false,
            },
        });

        return response.body;
    },
});