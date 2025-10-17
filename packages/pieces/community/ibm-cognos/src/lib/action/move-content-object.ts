import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callCognosApi, CognosAuthValue } from '../common';

export const moveContentObject = createAction({
    name: 'move_content_object',
    displayName: 'Move Content Object',
    description: 'Moves a content object to a different location in IBM Cognos Analytics',
    props: {
        contentId: Property.ShortText({
            displayName: 'Content Object ID',
            description: 'The ID of the content object to move',
            required: true,
        }),
        targetFolderId: Property.ShortText({
            displayName: 'Target Folder ID',
            description: 'The ID of the folder to move the content object to',
            required: true,
        }),
        conflictResolution: Property.StaticDropdown({
            displayName: 'Conflict Resolution',
            description: 'How to handle conflicts if an object with the same name exists',
            required: false,
            defaultValue: 'rename',
            options: {
                options: [
                    { label: 'Rename', value: 'rename' },
                    { label: 'Replace', value: 'replace' },
                    { label: 'Skip', value: 'skip' },
                ],
            },
        }),
    },
    async run(context) {
        const { contentId, targetFolderId, conflictResolution } = context.propsValue;
        const auth = context.auth as CognosAuthValue;

        const response = await callCognosApi(
            HttpMethod.POST,
            auth,
            `/content/${contentId}`,
            {
                targetFolder: targetFolderId,
                conflictResolution: conflictResolution || 'rename',
            },
            {
                action: 'move',
            }
        );

        return response.body;
    },
});

