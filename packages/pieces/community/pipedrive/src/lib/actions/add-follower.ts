import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ownerIdProp } from '../common/props';
import { pipedriveApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const addFollowerAction = createAction({
    auth: pipedriveAuth,
    name: 'add-follower',
    displayName: 'Add Follower',
    description: 'Adds a follower to a deal, person, organization or product using Pipedrive API v2.', // ✅ Updated description
    props: {
        followerId: ownerIdProp('Follower', true),
        entity: Property.StaticDropdown({
            displayName: 'Target Object',
            description: 'Type of object to add the follower to.',
            required: true,
            options: {
                disabled: false,
                options: [
                    {
                        label: 'Deal',
                        value: 'deals', // ✅ Changed to plural for consistency with API paths
                    },
                    {
                        label: 'Person',
                        value: 'persons', // ✅ Changed to plural for consistency with API paths
                    },
                    {
                        label: 'Organization',
                        value: 'organizations', // ✅ Changed to plural for consistency with API paths
                    },
                    {
                        label: 'Product',
                        value: 'products', // ✅ Changed to plural for consistency with API paths
                    },
                ],
            },
        }),
        entityId: Property.ShortText({ // Pipedrive IDs are typically numbers, but ShortText is fine if conversion happens downstream or API handles it.
            displayName: 'Target Object ID',
            description: 'ID of the object to add the follower to.',
            required:true
        }),
    },
    async run(context) {
        const { followerId, entity, entityId } = context.propsValue;

        // The endpoint construction remains the same, assuming pipedriveApiCall
        // automatically prefixes with '/v2/' as per general API changes.
        // Example: /v2/deals/{id}/followers
        const resourceUri = `/${entity}/${entityId}/followers`; // ✅ Endpoint path constructed

        if (!resourceUri) { // This check is technically redundant if `entity` is always one of the dropdown values
            throw new Error(`Invalid object type: ${entity}`);
        }

        const response = await pipedriveApiCall({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.POST,
            resourceUri: resourceUri, // ✅ Will be prefixed with /v2/ by pipedriveApiCall
            body: {
                user_id: followerId, // ✅ 'user_id' is still the correct parameter for adding a follower in v2
            },
        });

        // The v2 API follower object response is simpler (user_id, add_time).
        // The current return handles this automatically.
        return response;
    },
});
