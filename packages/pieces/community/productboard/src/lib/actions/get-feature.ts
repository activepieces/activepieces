import { createAction, StaticPropsValue } from '@activepieces/pieces-framework';
import { HttpMethod, HttpResponse } from '@activepieces/pieces-common';
import { productboardAuth } from '../common/auth';
import { productboardCommon } from '../common/client';
import { productboardProps } from '../common/props';

/**
 * Action to get an existing feature from Productboard.
 */
export const getFeature = createAction({
    name: 'get_feature',
    displayName: 'Get Feature',
    description: 'Get an existing feature in Productboard',
    auth: productboardAuth,
    props: {
        feature_id: productboardProps.feature_id(),
    },
    async run(context) {
        const { feature_id } = context.propsValue;

        const response = await productboardCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.GET,
            resourceUri: `/features/${feature_id}`,
        });

        return response.body;
    },
});
