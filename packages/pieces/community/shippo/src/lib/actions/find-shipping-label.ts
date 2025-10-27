import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { shippoAuth } from '../common/auth';
import { shippoCommon } from '../common/client';

export const findShippingLabel = createAction({
    name: 'find_shipping_label',
    displayName: 'Find Shipping Label',
    description: 'Searches for a shipping label by its ID',
    auth: shippoAuth,
    props: {
        label_id: Property.ShortText({
            displayName: 'Label ID',
            description: 'The ID of the shipping label to find',
            required: true,
        }),
    },
    async run(context) {
        const { label_id } = context.propsValue;

        const response = await shippoCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: `/labels/${label_id}`,
        });

        return response.body;
    },
});
