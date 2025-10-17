import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callCognosApi, CognosAuthValue } from '../common';

export const updateContentObject = createAction({
    name: 'update_content_object',
    displayName: 'Update Content Object',
    description: 'Updates an existing content object in IBM Cognos Analytics',
    props: {
        contentId: Property.ShortText({
            displayName: 'Content Object ID',
            description: 'The ID of the content object to update',
            required: true,
        }),
        name: Property.ShortText({
            displayName: 'Name',
            description: 'The new name of the content object',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'The new description of the content object',
            required: false,
        }),
        type: Property.ShortText({
            displayName: 'Type',
            description: 'The type of the content object (e.g., report, dashboard, folder)',
            required: false,
        }),
        version: Property.Number({
            displayName: 'Version',
            description: 'Object version for optimistic concurrency control',
            required: false,
        }),
    },
    async run(context) {
        const { contentId, name, description, type, version } = context.propsValue;
        const auth = context.auth as CognosAuthValue;

        const updateBody: Record<string, unknown> = {};
        
        if (name !== undefined) {
            updateBody.defaultName = name;
        }
        if (description !== undefined) {
            updateBody.defaultDescriptions = description;
        }
        if (type !== undefined) {
            updateBody.type = type;
        }
        if (version !== undefined) {
            updateBody.version = version;
        }

        const response = await callCognosApi(
            HttpMethod.PATCH,
            auth,
            `/content/${contentId}`,
            updateBody
        );

        return response.body;
    },
});

