import { createAction, Property } from '@activepieces/pieces-framework';
import {
  createTask,
  getContacts,
  getUsers,
  LeadConnectorTaskStatus,
} from '../common';
import { leadConnectorAuth } from '../..';

export const createTaskAction = createAction({
  auth: leadConnectorAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a new task.',
  props: {
    contact: Property.Dropdown({
      displayName: 'Contact',
      description: 'The contact to use.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
          };

        const contacts = await getContacts(auth as string);

        return {
          options: contacts.map((contact) => {
            return {
              label: contact.contactName,
              value: contact.id,
            };
          }),
        };
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: true,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      required: false,
    }),
    assignedTo: Property.Dropdown({
      displayName: 'Assigned To',
      required: false,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth)
          return {
            disabled: true,
            options: [],
          };

        const users = await getUsers(auth as string);
        return {
          options: users.map((user: any) => {
            return {
              label: `${user.firstName} ${user.lastName}`,
              value: user.id,
            };
          }),
        };
      },
    }),
    status: Property.Dropdown({
      displayName: 'Status',
      required: false,
      refreshers: [],
      options: async () => {
        const statuses = Object.values(LeadConnectorTaskStatus);

        return {
          options: statuses.map((status) => {
            return {
              label: status.charAt(0).toUpperCase() + status.slice(1),
              value: status,
            };
          }),
        };
      },
    }),
  },

  async run({ auth, propsValue }) {
    const { contact, title, dueDate, description, assignedTo, status } =
      propsValue;

    return await createTask(auth, contact, {
      title: title,
      // Needs to be ISO string without milliseconds
      dueDate: new Date(dueDate).toISOString().split('.')[0] + 'Z',
      description: description,
      assignedTo: assignedTo,
      status: status as LeadConnectorTaskStatus,
    });
  },
});
