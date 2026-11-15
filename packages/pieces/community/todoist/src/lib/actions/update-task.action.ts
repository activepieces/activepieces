import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from '@activepieces/pieces-framework';
import { todoistRestClient } from '../common/client/rest-client';
import { todoistAuth } from '../..';
import { updateTaskActionOutputSchema } from '../output-schemas';

export const todoistUpdateTaskAction = createAction({
  auth: todoistAuth,
  name: 'update_task',
  classification: 'WRITE',
  displayName: 'Update Task',
  description: 'Change the title, details, labels, priority or due date of a task.',
  audience: 'human',
  aiMetadata: { description: 'Updates fields (content, description, labels, priority, due date) on an existing Todoist task identified by task_id. Use to edit a task you already know the ID of; only the fields you pass are changed. Idempotent: re-sending the same values overwrites to the same end state with no extra effect.', idempotent: true },
  outputSchema: updateTaskActionOutputSchema,
  propertyGroups: [
    {
      key: 'target',
      display: 'section',
      label: 'Task to update',
      icon: 'inbox',
      props: ['task_id'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'sliders',
      props: [
        'changes_info',
        'content',
        'description',
        'labels',
        'priority',
        'due_date',
      ],
    },
  ],
  props: {
    task_id: Property.ShortText({
      displayName: 'Task ID',
      description: "The task's ID, from a Create Task or Find Task step.",
      placeholder: 'e.g. 6X7rM8997g3RQmvh',
      required: true,
    }),
    changes_info: Property.MarkDown({
      value: 'Fields left empty keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    content: Property.LongText({
      displayName: 'Title',
      description: 'Markdown and links are supported.',
      placeholder: 'e.g. Buy milk',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Extra details shown under the title. Markdown is supported.',
      required: false,
    }),
    labels: Property.Array({
      displayName: 'Labels',
      required: false,
      description: "Replaces the task's labels with these names.",
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
    const { task_id, content, description, priority, due_date } = propsValue;
    const labels = propsValue.labels as string[];

    assertNotNullOrUndefined(token, 'token');
    return await todoistRestClient.tasks.update({
      token,
      task_id,
      content,
      description,
      labels,
      priority,
      due_date,
    });
  },
});
