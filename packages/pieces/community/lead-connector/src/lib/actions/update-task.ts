import {
  createAction,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { getTasks, updateTask } from '../common';
import { leadConnectorProps } from '../common/props';
import { requestBodyUtils } from '../common/request-body';
import { leadConnectorAuth } from '../..';

export const updateTaskAction = createAction({
  auth: leadConnectorAuth,
  name: 'update_task',
  classification: 'WRITE',
  displayName: 'Update Task',
  description: 'Update a task.',
  audience: 'both',
  aiMetadata: { description: 'Updates an existing task on a GoHighLevel/LeadConnector contact, identified by contact ID and task ID, changing title, due date, description, assignee, or completed flag. Use to edit or complete a known task. Idempotent — repeating with the same input leaves the task in the same state.', idempotent: true },
  propertyGroups: [
    {
      key: 'task',
      display: 'section',
      label: 'Task to update',
      icon: 'file',
      props: ['contact', 'task', 'changesInfo'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'sliders',
      props: ['title', 'description', 'dueDate', 'assignedTo', 'completed'],
    },
  ],
  props: {
    contact: leadConnectorProps.contact({ required: true }),
    task: Property.Dropdown({
      auth: leadConnectorAuth,
      displayName: 'Task',
      required: true,
      refreshers: ['contact'],
      options: async ({ auth, contact }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your account first',
          };
        }
        if (typeof contact !== 'string' || !contact) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Select a contact first',
          };
        }

        const tasks = await getTasks(auth.access_token, contact);
        return {
          options: tasks.map((task: LeadConnectorTaskOption) => {
            return {
              label: task.title,
              value: task.id,
            };
          }),
        };
      },
    }),
    changesInfo: Property.MarkDown({
      value: 'Empty fields keep their current value, except Completed.',
      variant: MarkdownVariant.INFO,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      required: false,
    }),
    assignedTo: leadConnectorProps.user({
      displayName: 'Assigned To',
      required: false,
    }),
    completed: Property.Checkbox({
      displayName: 'Completed',
      description: 'Always applied: unticked marks a done task as open.',
      required: false,
      defaultValue: false,
    }),
  },

  async run({ auth, propsValue }) {
    const {
      contact,
      task,
      title,
      dueDate,
      description,
      assignedTo,
      completed,
    } = propsValue;

    return await updateTask(
      auth.access_token,
      contact,
      task,
      requestBodyUtils.omitEmptyValues({
        title: title,
        dueDate: dueDate ? formatDate(dueDate) : undefined,
        body: description,
        assignedTo: assignedTo,
        completed,
      })
    );
  },
});

function formatDate(date: string) {
  return new Date(date).toISOString().split('.')[0] + 'Z';
}

type LeadConnectorTaskOption = {
  id: string;
  title: string;
};
