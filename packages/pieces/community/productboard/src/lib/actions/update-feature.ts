import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { productboardAuth } from '../common/auth';
import { productboardCommon } from '../common/client';
import { productboardProps } from '../common/props';

/**
 * Action to update an existing feature in Productboard.
 */
export const updateFeature = createAction({
    name: 'update_feature',
    displayName: 'Update Feature',
    description: 'Updates an existing feature in Productboard.',
    audience: 'both',
    aiMetadata: { description: 'Updates an existing Productboard feature identified by its feature id, setting only the supplied fields (name, description, status, or archived flag) and leaving others unchanged. Use to edit a known feature; if no fields are provided it makes no change. Idempotent: re-applying the same field values leaves the feature in the same state.', idempotent: true },
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

        const data: Record<string, any> = {};

        if (name) {
            data['name'] = name;
        }

        if (description) {
            data['description'] = description;
        }

        if (status) {
            data['status'] = { id: status };
        }

        if (archived !== undefined) {
            data['archived'] = archived;
        }

        if (Object.keys(data).length === 0) {
            return { success: true, message: 'No fields to update.' };
        }

        const response = await productboardCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.PATCH,
            resourceUri: `/features/${feature_id}`,
            body: { data },
        });

        return response.body;
    },
});
