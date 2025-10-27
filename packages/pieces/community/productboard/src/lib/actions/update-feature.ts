import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { productboardAuth } from '../common/auth';
import { productboardCommon } from '../common/client';

export const updateFeature = createAction({
    name: 'update_feature',
    displayName: 'Update Feature',
    description: 'Updates an existing feature in Productboard.',
    auth: productboardAuth,
    props: {
        feature_id: Property.Dropdown({
            displayName: 'Feature',
            description: 'The feature to update.',
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
        }),
        name: Property.ShortText({
            displayName: 'Feature Name',
            description: 'New name for the feature.',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'New description for the feature.',
            required: false,
        }),
        status: Property.Dropdown({
            displayName: 'Status',
            description: 'New status for the feature.',
            required: false,
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
                    resourceUri: '/feature-statuses'
                });
                const statuses = response.body['data'] ?? [];
                return {
                    disabled: false,
                    options: statuses.map((status: { id: string; name: string }) => ({
                        label: status.name,
                        value: status.id
                    }))
                };
            }
        }),
        archived: Property.Checkbox({
            displayName: 'Archived',
            description: 'Whether the feature is archived.',
            required: false,
        }),
    },
    async run(context) {
        const { feature_id, name, description, status, archived } = context.propsValue;

        const feature: Record<string, any> = {
            data: {},
        };

        if (name) {
            feature['data'].name = name;
        }

        if (description) {
            feature['data'].description = description;
        }

        if (status) {
            feature['data'].status = { id: status };
        }

        if (archived !== undefined) {
            feature['data'].archived = archived;
        }

        if (Object.keys(feature['data']).length === 0) {
            return { success: true, message: 'No fields to update.' };
        }

        const response = await productboardCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.PATCH,
            resourceUri: `/features/${feature_id}`,
            body: feature,
        });

        return response.body;
    },
});
