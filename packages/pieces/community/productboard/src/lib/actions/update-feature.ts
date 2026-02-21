import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { productboardAuth } from '../common/auth';
import { productboardCommon } from '../common/client';
import { productboardProps } from '../common/props';

export const updateFeature = createAction({
    name: 'update_feature',
    displayName: 'Update Feature',
    description: 'Updates an existing feature in Productboard.',
    auth: productboardAuth,
    props: {
        feature_id: productboardProps.feature_id(),
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
        status: productboardProps.status_id(false),
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
