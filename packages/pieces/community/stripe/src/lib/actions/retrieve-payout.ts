import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';
import { stripeProps } from '../common/props';

export const stripeRetrievePayout = createAction({
    name: 'retrieve_payout',
    auth: stripeAuth,
    displayName: 'Retrieve Payout',
    description: 'Retrieves the details of an existing payout.',
    props: {
        payout: stripeProps.payout(),
    },
    async run(context) {
        const payoutId = context.propsValue.payout;

        const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${stripeCommon.baseUrl}/payouts/${payoutId}`,
            headers: {
                'Authorization': 'Bearer ' + context.auth,
            },
        });

        return response.body;
    },
});