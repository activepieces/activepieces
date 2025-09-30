import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { productboardAuth } from '../common/auth';
import { productboardCommon } from '../common/client';

export const getFeature = createAction({
    name: 'get_feature',
    displayName: 'Get Feature',
    description: 'Retrieves an existing feature.',
    auth: productboardAuth,
    props: {
        feature_id: Property.Dropdown({
            displayName: 'Feature',
            description: 'The feature to retrieve.',
            required: true,
            refreshers: [],
            options: async ({ auth }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please authenticate first'
                    };
                }
                const response = await productboardCommon.apiCall({
                    auth: auth as string,
                    method: HttpMethod.GET,
                    resourceUri: '/features'
                });
                const features = response.body['data'] ?? [];
                return {
                    disabled: false,
                    options: features.map((feature: { id: string; name: string }) => ({
                        label: feature.name,
                        value: feature.id
                    }))
                };
            }
        })
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
