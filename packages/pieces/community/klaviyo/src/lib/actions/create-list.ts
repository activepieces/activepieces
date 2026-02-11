import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../auth';
import { klaviyoCommon } from '../common';

export const createList = createAction({
    auth: klaviyoAuth,
    name: 'create_list',
    displayName: 'Create List',
    description: 'Create a new list in Klaviyo.',
    props: {
        name: Property.ShortText({
            displayName: 'List Name',
            required: true,
        }),
    },
    async run(context) {
        const { name } = context.propsValue;
        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${klaviyoCommon.baseUrl}/lists`,
            headers: {
                'revision': klaviyoCommon.apiVersion,
                'content-type': 'application/vnd.api+json',
                'accept': 'application/vnd.api+json'
            },
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string,
            },
            body: {
                data: {
                    type: 'list',
                    attributes: {
                        name
                    }
                }
            },
        });
        return response.body;
    },
});
