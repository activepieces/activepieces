import { createAction, OAuth2PropertyValue, Property } from '@activepieces/pieces-framework';
import {
  createTask,
  getContacts,
  getUsers,
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

        const contacts = await getContacts(auth as OAuth2PropertyValue);

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

        const users = await getUsers(auth as OAuth2PropertyValue);
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
    completed: Property.Checkbox({
      displayName: 'Completed',
      required: true,
      defaultValue: false,
    }),
  },

  async run({ auth, propsValue }) {
    const { contact, title, dueDate, description, assignedTo, completed } =
      propsValue;

    return await createTask(auth.access_token, contact, {
      title: title,
      // Needs to be ISO string without milliseconds
      dueDate: new Date(dueDate).toISOString().split('.')[0] + 'Z',
      body: description,
      assignedTo: assignedTo,
      completed,
    });
  },
});
