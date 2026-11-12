import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { genayaAuth } from '../auth';
import { genayaApi } from '../common/client';
import { genayaInput } from '../common/input';
import { genayaOutput } from '../common/mappers';
import { genayaProps } from '../common/props';
import { GenayaTask } from '../common/types';

export const createTask = createAction({
  auth: genayaAuth,
  name: 'create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Creates a task in a Genaya task group.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a task in a Genaya task group (task boards are environments, which hold groups, which hold tasks). Needs a title and the group ID; the environment is only used to pick the group. Each call creates a new task, so retries duplicate.',
    idempotent: false,
  },
  props: {
    environment: genayaProps.taskEnvironmentDropdown,
    group: genayaProps.taskGroupDropdown,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'For example "Call the customer back".',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      required: false,
      defaultValue: 'normal',
      options: {
        options: [
          { label: 'Lowest', value: 'lowest' },
          { label: 'Low', value: 'low' },
          { label: 'Normal', value: 'normal' },
          { label: 'High', value: 'high' },
          { label: 'Urgent', value: 'urgent' },
        ],
      },
    }),
    due_date: Property.DateTime({
      displayName: 'Due Date',
      description: 'When the task is due, for example 2026-06-20T15:00:00Z.',
      required: false,
    }),
    assignees: genayaProps.teamMembersDropdown({
      description: 'Team members to assign to the task.',
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Free-form tags, for example follow-up.',
      required: false,
    }),
  },
  async run(context) {
    const apiKey = context.auth.secret_text;
    const props = context.propsValue;
    const groupId = genayaInput.text(props.group);
    const title = genayaInput.text(props.title);
    if (groupId === undefined) {
      throw new Error('Select the task group to create the task in.');
    }
    if (title === undefined) {
      throw new Error('Enter a title for the task.');
    }
    const assigneeIds = genayaInput.textList(props.assignees);
    const tags = genayaInput.textList(props.tags);
    const response = await genayaApi.request<{ data: GenayaTask }>({
      apiKey,
      method: HttpMethod.POST,
      path: '/tasks',
      body: genayaInput.compact({
        title,
        groupId,
        description: genayaInput.text(props.description),
        priority: genayaInput.text(props.priority),
        dueDate: genayaInput.text(props.due_date),
        assignees: assigneeIds.length > 0 ? await assigneesOf({ apiKey, ids: assigneeIds }) : undefined,
        tags: tags.length > 0 ? tags : undefined,
      }),
    });
    return genayaOutput.task(response.data);
  },
});

// A task stores each assignee as an id and a display name, so the names are
// read from the team roster.
async function assigneesOf({ apiKey, ids }: { apiKey: string; ids: string[] }): Promise<{ id: string; name?: string }[]> {
  const members = await genayaProps.listTeamMembers(apiKey);
  return ids.map((id) => {
    const member = members.find((candidate) => candidate.id === id);
    const name = member?.name || member?.email;
    return name ? { id, name } : { id };
  });
}
