import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { missiveAuth } from '../common/auth';
import { missiveCommon } from '../common/client';

export const createTask = createAction({
    name: 'create_task',
    displayName: 'Create Task',
    description: 'Create a task associated with a conversation',
    auth: missiveAuth,
    props: {
        title: Property.ShortText({
            displayName: 'Title',
            description: 'Title of the task',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'Description of the task',
            required: false,
        }),
        state: Property.StaticDropdown({
            displayName: 'State',
            description: 'Current state of the task',
            required: false,
            options: {
                options: [
                    { label: 'Todo', value: 'todo' },
                    { label: 'In Progress', value: 'in_progress' },
                    { label: 'Closed', value: 'closed' }
                ]
            }
        }),
        organization: Property.ShortText({
            displayName: 'Organization ID',
            description: 'Organization ID for the task',
            required: false,
        }),
        team: Property.ShortText({
            displayName: 'Team ID',
            description: 'Team ID to assign the task to',
            required: false,
        }),
        assignees: Property.Array({
            displayName: 'Assignees',
            description: 'User IDs to assign the task to',
            required: false,
            properties: {
                user_id: Property.ShortText({
                    displayName: 'User ID',
                    description: 'ID of the user to assign',
                    required: true,
                })
            }
        }),
        due_at: Property.DateTime({
            displayName: 'Due Date',
            description: 'Due date for the task',
            required: false,
        }),
        subtask: Property.Checkbox({
            displayName: 'Is Subtask',
            description: 'Whether this is a subtask within a conversation',
            required: false,
            defaultValue: false,
        }),
        conversation: Property.ShortText({
            displayName: 'Conversation ID',
            description: 'ID of the conversation to associate with (required for subtasks)',
            required: false,
        }),
        references: Property.Array({
            displayName: 'References',
            description: 'Message references to find or create parent conversation',
            required: false,
            properties: {
                reference: Property.ShortText({
                    displayName: 'Reference',
                    description: 'Message reference',
                    required: true,
                })
            }
        }),
        conversation_subject: Property.ShortText({
            displayName: 'Conversation Subject',
            description: 'Subject for new conversation if created via references',
            required: false,
        }),
        add_users: Property.Array({
            displayName: 'Add Users',
            description: 'Additional users to add to the parent conversation',
            required: false,
            properties: {
                user_id: Property.ShortText({
                    displayName: 'User ID',
                    description: 'ID of the user to add',
                    required: true,
                })
            }
        })
    },
    async run(context) {
        const {
            title,
            description,
            state,
            organization,
            team,
            assignees,
            due_at,
            subtask,
            conversation,
            references,
            conversation_subject,
            add_users
        } = context.propsValue;

        const taskData: Record<string, any> = {
            title,
        };
        if (description) taskData['description'] = description;
        if (state) taskData['state'] = state;
        if (organization) taskData['organization'] = organization;
        if (team) taskData['team'] = team;
        if (assignees && assignees.length > 0) taskData['assignees'] = assignees.map((assignee: any) => assignee.user_id);
        if (due_at) taskData['due_at'] = Math.floor(new Date(due_at).getTime() / 1000);
        if (subtask !== undefined) taskData['subtask'] = subtask;
        if (conversation) taskData['conversation'] = conversation;
        if (references && references.length > 0) taskData['references'] = references.map((ref: any) => ref.reference);
        if (conversation_subject) taskData['conversation_subject'] = conversation_subject;
        if (add_users && add_users.length > 0) taskData['add_users'] = add_users.map((user: any) => user.user_id);

        const response = await missiveCommon.apiCall({
            auth: context.auth,
            method: HttpMethod.POST,
            resourceUri: '/tasks',
            body: {
                tasks: [taskData]
            },
        });
        return response.body;
    },
}); 