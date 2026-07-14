import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
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
    audience: 'both',
    aiMetadata: { description: 'Retrieves a single Productboard feature by its feature id. Use to look up a feature\'s current details before acting on it or to confirm it exists. Read-only and idempotent.', idempotent: true },
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
