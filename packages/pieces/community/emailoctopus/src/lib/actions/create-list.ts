import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { emailoctopusAuth } from '../common/auth';
import { emailoctopusCommon } from '../common/client';

export const createList = createAction({
    name: 'create_list',
    displayName: 'Create List',
    description: 'Creates a new list',
    auth: emailoctopusAuth,
    props: {
        name: Property.ShortText({
            displayName: 'List Name',
            description: 'The name of the list to create',
            required: true,
        }),
    },
    async run(context) {
        const { name } = context.propsValue;

        const response = await emailoctopusCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/lists',
            body: {
                name
            }
        });

        return response.body;
    },
});
