import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { teamworkAuth } from '../common/auth';
import { teamworkCommon } from '../common/client';

export const createTaskComment = createAction({
    name: 'create_task_comment',
    displayName: 'Create Task Comment',
    description: 'Add a comment to a task in Teamwork',
    auth: teamworkAuth,
    props: {
        taskId: Property.ShortText({
            displayName: 'Task ID',
            description: 'ID of the task to comment on',
            required: true,
        }),
        body: Property.LongText({
            displayName: 'Comment',
            description: 'Content of the comment',
            required: true,
        }),
        notify: Property.Checkbox({
            displayName: 'Notify People',
            description: 'Send notifications to people involved in the task',
            required: false,
            defaultValue: true,
        }),
        isPrivate: Property.Checkbox({
            displayName: 'Private Comment',
            description: 'Make this comment private (only visible to admins)',
            required: false,
            defaultValue: false,
        }),
    },
    async run(context) {
        const { taskId, body, notify, isPrivate } = context.propsValue;

        const commentData = {
            comment: {
                body,
                notify: notify ? 'yes' : 'no',
                'isprivate': isPrivate ? 1 : 0,
            }
        };

        const response = await teamworkCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: `/tasks/${taskId}/comments.json`,
            body: commentData,
        });

        return response;
    },
});
