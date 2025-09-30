import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { productboardAuth } from '../common/auth';
import { productboardCommon } from '../common/client';

export const getFeature = createAction({
    name: 'get_feature',
    displayName: 'Get Feature',
    description: 'Retrieves detailed information about a specific feature from Productboard',
    auth: productboardAuth,
    props: {
        feature_id: Property.Dropdown({
            displayName: 'Feature',
            description: 'Feature to retrieve details for',
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

                try {
                    const response = await productboardCommon.apiCall({
                        auth: auth as string,
                        method: HttpMethod.GET,
                        resourceUri: '/features'
                    });

                    const features = response.body.data || [];
                    return {
                        disabled: false,
                        options: features.map((feature: any) => ({
                            label: feature.name || `Feature ${feature.id}`,
                            value: feature.id
                        }))
                    };
                } catch (error) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Error loading features'
                    };
                }
            }
        })
    },
    async run(context) {
        try {
            const response = await productboardCommon.apiCall({
                auth: context.auth,
                method: HttpMethod.GET,
                resourceUri: `/features/${context.propsValue.feature_id}`
            });

            return response.body;
        } catch (error) {
            throw new Error(`Failed to get feature: ${error}`);
        }
    },
});
