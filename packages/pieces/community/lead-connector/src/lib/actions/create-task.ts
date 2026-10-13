import { createAction, Property } from '@activepieces/pieces-framework';
import { createTask } from '../common';
import { leadConnectorProps } from '../common/props';
import { leadConnectorAuth } from '../..';

export const createTaskAction = createAction({
  auth: leadConnectorAuth,
  name: 'create_task',
  classification: 'WRITE',
  displayName: 'Create Task',
  description: 'Create a new task.',
  audience: 'both',
  aiMetadata: { description: 'Creates a task attached to a GoHighLevel/LeadConnector contact, with a title, due date, optional description, assignee, and completed flag. Use to schedule follow-up work against a contact. Requires contact, title, and due date; not idempotent — each call creates a separate task.', idempotent: false },
  propertyGroups: [
    {
      key: 'task',
      display: 'section',
      label: 'Task',
      icon: 'file',
      props: ['contact', 'title', 'description'],
    },
    {
      key: 'schedule',
      display: 'section',
      label: 'Due date and owner',
      icon: 'calendar',
      props: ['dueDate', 'assignedTo', 'completed'],
    },
  ],
  props: {
    contact: leadConnectorProps.contact({ required: true }),
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      required: true,
    }),
    assignedTo: leadConnectorProps.user({
      displayName: 'Assigned To',
      required: false,
    }),
    completed: Property.Checkbox({
      displayName: 'Completed',
      required: false,
      defaultValue: false,
    }),
  },

  async run({ auth, propsValue }) {
    const { contact, title, dueDate, description, assignedTo, completed } =
      propsValue;

    return await createTask(auth.access_token, contact, {
      title: title,
      dueDate: new Date(dueDate).toISOString().split('.')[0] + 'Z',
      body: description,
      assignedTo: assignedTo,
      completed,
    });
  },
});
