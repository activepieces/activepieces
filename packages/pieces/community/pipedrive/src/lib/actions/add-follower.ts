import { pipedriveAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ownerIdProp } from '../common/props';
import { pipedriveApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const addFollowerAction = createAction({
    auth: pipedriveAuth,
    name: 'add-follower',
    displayName: 'Add Follower',
    description: 'Adds a follower to a deal, person, organization or product using Pipedrive API v2.', 
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
                        value: 'deals', 
                    },
                    {
                        label: 'Person',
                        value: 'persons',
                    },
                    {
                        label: 'Organization',
                        value: 'organizations', 
                    },
                    {
                        label: 'Product',
                        value: 'products', 
                    },
                ],
            },
        }),
        entityId: Property.ShortText({ 
            displayName: 'Target Object ID',
            description: 'ID of the object to add the follower to.',
            required:true
        }),
    },
    async run(context) {
        const { followerId, entity, entityId } = context.propsValue;
        const resourceUri = `/v2/${entity}/${entityId}/followers`; 

        if (!resourceUri) { // This check is technically redundant if `entity` is always one of the dropdown values
            throw new Error(`Invalid object type: ${entity}`);
        }

        const response = await pipedriveApiCall({
            accessToken: context.auth.access_token,
            apiDomain: context.auth.data['api_domain'],
            method: HttpMethod.POST,
            resourceUri: resourceUri, 
            body: {
                user_id: followerId, 
            },
        });
        return response;
    },
});
