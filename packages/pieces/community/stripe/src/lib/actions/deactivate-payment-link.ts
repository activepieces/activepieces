import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';
import { stripeProps } from '../common/props';

export const stripeDeactivatePaymentLink = createAction({
    name: 'deactivate_payment_link',
    auth: stripeAuth,
    displayName: 'Deactivate Payment Link',
    description: 'Disable/deactivate a Payment Link so it can no longer be used.',
    props: {
        payment_link: stripeProps.paymentLink(),
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