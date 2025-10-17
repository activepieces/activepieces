import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callCognosApi, CognosAuthValue } from '../common';

export const getContentObject = createAction({
    name: 'get_content_object',
    displayName: 'Get Content Object',
    description: 'Retrieves the details of a specific content object from IBM Cognos Analytics',
    props: {
        contentId: Property.ShortText({
            displayName: 'Content Object ID',
            description: 'The ID of the content object to retrieve',
            required: true,
        }),
        includeMetadata: Property.Checkbox({
            displayName: 'Include Metadata',
            description: 'Include additional metadata in the response',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        const { contentId, includeMetadata } = context.propsValue;
        const auth = context.auth as CognosAuthValue;

        const queryParams = includeMetadata ? { metadata: 'true' } : undefined;

        const response = await callCognosApi(
            HttpMethod.GET,
            auth,
            `/content/${contentId}`,
            undefined,
            queryParams
        );

        return response.body;
    },
});

