import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistRestClient } from '../common/client/rest-client';
import {
  todoistProjectIdDropdown,
  todoistSectionIdDropdown,
} from '../common/props';
import { TodoistCreateTaskRequest } from '../common/models';
import { todoistAuth } from '../..';
import { createTaskActionOutputSchema } from '../output-schemas';

export const todoistCreateTaskAction = createAction({
  auth: todoistAuth,
  name: 'create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Add a task to a Todoist project or your Inbox.',
  audience: 'human',
  aiMetadata: { description: 'Creates a new task in Todoist with content, optional description, labels, priority (1-4), and a natural-language or ISO due date. Use to add a to-do item; without a project_id it lands in the user\'s Inbox. Not idempotent: each call appends a separate task even if the content is identical.', idempotent: false },
  outputSchema: createTaskActionOutputSchema,
  propertyGroups: [
    {
      key: 'destination',
      display: 'section',
      label: 'Where to add it',
      icon: 'inbox',
      props: ['project_id', 'section_id'],
    },
    {
      key: 'task',
      display: 'section',
      label: 'Task',
      icon: 'text',
      props: ['content', 'description'],
    },
    {
      key: 'details',
      display: 'section',
      label: 'Details',
      icon: 'tag',
      props: ['labels', 'priority', 'due_date'],
    },
  ],
  props: {
    project_id: todoistProjectIdDropdown(
      'Leave empty to add the task to your Inbox.'
    ),
    section_id: todoistSectionIdDropdown,
    content: Property.LongText({
      displayName: 'Title',
      description: 'Markdown and links are supported.',
      placeholder: 'e.g. Buy milk',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Extra details shown under the title. Markdown is supported.',
      required: false,
    }),
    labels: Property.Array({
      displayName: 'Labels',
      required: false,
      description: 'Names of personal or shared labels to add.',
    }),
    priority: Property.Number({
      displayName: 'Priority',
      description: '1 is normal, 4 is urgent; Todoist shows 4 as P1.',
      required: false,
      width: 'half',
    }),
    due_date: Property.ShortText({
      displayName: 'Due Date',
      description:
        'YYYY-MM-DD or English words. Repeating dates work too.',
      placeholder: 'e.g. tomorrow 5pm',
      required: false,
      width: 'half',
    }),
  },

  async run({ auth, propsValue }) {
    const token = auth.access_token;
    const {
      project_id,
      content,
      description,
      labels,
      priority,
      due_date,
      section_id,
    } = propsValue as TodoistCreateTaskRequest;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(content, 'content');
    return await todoistRestClient.tasks.create({
      token,
      project_id,
      content,
      description,
      labels,
      priority,
      due_date,
      section_id,
    });
  },
});
