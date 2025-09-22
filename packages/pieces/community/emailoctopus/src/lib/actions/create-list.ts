import { propsValidation } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { emailoctopusAuth } from '../common/auth';
import { emailoctopusCommon, emailoctopusSchemas } from '../common/client';
import { createListProps } from '../common/properties';

export const createList = createAction({
    name: 'create_list',
    displayName: 'Create List',
    description: 'Creates a new list',
    auth: emailoctopusAuth,
    props: createListProps(),
    async run(context) {
        await propsValidation.validateZod(context.propsValue, emailoctopusSchemas.createList);
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
