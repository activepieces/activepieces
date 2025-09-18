import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';
// CHANGED: Import the specific dropdown you need
import { payoutIdDropdown } from '../common';

export const stripeRetrievePayout = createAction({
    name: 'retrieve_payout',
    auth: stripeAuth,
    displayName: 'Retrieve Payout',
    description: 'Retrieves the details of an existing payout.',
    props: {
        // CHANGED: Use the imported dropdown directly
        payout: payoutIdDropdown,
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