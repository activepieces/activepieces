import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { missiveAuth } from '../../';
import { missiveApiCall } from '../common/utils';

export const createTaskAction = createAction({
  auth: missiveAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a task associated with a conversation or as a standalone task',
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the task (max 1000 characters)',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'The description of the task (max 10000 characters)',
      required: false,
    }),
    state: Property.StaticDropdown({
      displayName: 'State',
      description: 'The current state of the task',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Todo', value: 'todo' },
          { label: 'In Progress', value: 'in_progress' },
          { label: 'Closed', value: 'closed' },
        ],
      },
    }),
    // Organization and team
    organizationId: Property.ShortText({
      displayName: 'Organization ID',
      description: 'Organization ID (required when using team, assignees, or add_users)',
      required: false,
    }),
    teamId: Property.ShortText({
      displayName: 'Team ID',
      description: 'Team ID (either team or assignees is required for standalone tasks)',
      required: false,
    }),
    assignees: Property.Array({
      displayName: 'Assignees',
      description: 'Array of user ID strings (either team or assignees is required for standalone tasks)',
      required: false,
    }),
    // Due date
    dueAt: Property.Number({
      displayName: 'Due At (Unix Timestamp)',
      description: 'Unix timestamp for task due date',
      required: false,
    }),
    // Subtask settings
    isSubtask: Property.Checkbox({
      displayName: 'Is Subtask',
      description: 'Whether this is a subtask of a conversation',
      required: false,
    }),
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'Parent conversation ID (required when subtask is true)',
      required: false,
    }),
    references: Property.Array({
      displayName: 'References',
      description: 'Array of strings for finding or creating parent conversation (used when creating a subtask)',
      required: false,
    }),
    conversationSubject: Property.ShortText({
      displayName: 'Conversation Subject',
      description: 'Subject for the parent conversation when creating via references',
      required: false,
    }),
    addUsers: Property.Array({
      displayName: 'Add Users',
      description: 'Array of user IDs to add to parent conversation (only for subtasks)',
      required: false,
    }),
  },
  async run(context) {
    const {
      title,
      description,
      state,
      organizationId,
      teamId,
      assignees,
      dueAt,
      isSubtask,
      conversationId,
      references,
      conversationSubject,
      addUsers,
    } = context.propsValue;

    const apiToken = context.auth.apiToken;

    // Build task object
    const task: Record<string, unknown> = {
      title,
    };

    if (description) task.description = description;
    if (state) task.state = state;
    if (organizationId) task.organization = organizationId;
    if (teamId) task.team = teamId;
    if (assignees && assignees.length > 0) task.assignees = assignees;
    if (dueAt) task.due_at = dueAt;
    if (isSubtask !== undefined) task.subtask = isSubtask;
    if (conversationId) task.conversation = conversationId;
    if (references && references.length > 0) task.references = references;
    if (conversationSubject) task.conversation_subject = conversationSubject;
    if (addUsers && addUsers.length > 0) task.add_users = addUsers;

    const response = await missiveApiCall(
      apiToken,
      '/tasks',
      HttpMethod.POST,
      { tasks: task }
    );

    return response;
  },
}); 