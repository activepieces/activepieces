import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wrikeAuth } from '../common/auth';
import { wrikeCommon } from '../common/client';

export const addComment = createAction({
    name: 'add_comment',
    displayName: 'Add Comment',
    description: 'Add a comment or internal note to a task or folder',
    auth: wrikeAuth,
    props: {
        entityType: Property.StaticDropdown({
            displayName: 'Entity Type',
            description: 'Select whether you want to add the comment to a task or folder',
            required: true,
            options: {
                options: [
                    { label: 'Task', value: 'tasks' },
                    { label: 'Folder', value: 'folders' },
                ],
            },
        }),
        entityId: Property.ShortText({
            displayName: 'Entity ID',
            description: 'The ID of the task or folder to add the comment to',
            required: true,
        }),
        text: Property.LongText({
            displayName: 'Comment Text',
            description: 'The text content of the comment',
            required: true,
        }),
        plainText: Property.Checkbox({
            displayName: 'Plain Text',
            description: 'Whether the comment should be treated as plain text (no HTML formatting). Default is HTML formatting.',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        const commentData: Record<string, any> = {
            text: context.propsValue['text'],
        };

        if (context.propsValue['plainText'] !== undefined) {
            commentData['plainText'] = context.propsValue['plainText'];
        }

        const response = await wrikeCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: `/${context.propsValue['entityType']}/${context.propsValue['entityId']}/comments`,
            body: commentData,
        });

        return response.body;
    },
});
