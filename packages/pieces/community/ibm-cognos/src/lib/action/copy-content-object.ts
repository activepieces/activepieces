import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { callCognosApi, CognosAuthValue } from '../common';

export const copyContentObject = createAction({
    name: 'copy_content_object',
    displayName: 'Copy Content Object',
    description: 'Copies a content object to a different location in IBM Cognos Analytics',
    props: {
        contentId: Property.ShortText({
            displayName: 'Content Object ID',
            description: 'The ID of the content object to copy',
            required: true,
        }),
        targetFolderId: Property.ShortText({
            displayName: 'Target Folder ID',
            description: 'The ID of the folder to copy the content object to',
            required: true,
        }),
        newName: Property.ShortText({
            displayName: 'New Name',
            description: 'Optional new name for the copied object',
            required: false,
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
        const { contentId, targetFolderId, newName, conflictResolution } = context.propsValue;
        const auth = context.auth as CognosAuthValue;

        const body: Record<string, unknown> = {
            targetFolder: targetFolderId,
            conflictResolution: conflictResolution || 'rename',
        };

        if (newName) {
            body.newName = newName;
        }

        const response = await callCognosApi(
            HttpMethod.POST,
            auth,
            `/content/${contentId}`,
            body,
            {
                action: 'copy',
            }
        );

        return response.body;
    },
});

