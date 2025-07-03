import {
  createAction,
  OAuth2PropertyValue,
  Property,
} from '@activepieces/pieces-framework';
import {
  getContacts,
  getTask,
  getTasks,
  getUsers,
  updateTask,
} from '../common';
import { leadConnectorAuth } from '../..';

export const updateTaskAction = createAction({
  auth: leadConnectorAuth,
  name: 'update_task',
  displayName: 'Update Task',
  description: 'Update a task.',
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
    task: Property.Dropdown({
      displayName: 'Task',
      required: true,
      refreshers: ['contact'],
      options: async ({ auth, contact }) => {
        if (!auth || !contact)
          return {
            disabled: true,
            options: [],
          };

        const tasks = await getTasks(
          (auth as OAuth2PropertyValue).access_token,
          contact as string
        );
        return {
          options: tasks.map((task: any) => {
            return {
              label: task.title,
              value: task.id,
            };
          }),
        };
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      required: false,
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

    // let originalData: any;
    // if (!title || !dueDate)
    //   originalData = await getTask(auth.access_token, contact, task);

    return await updateTask(auth.access_token, contact, task, {
      title: title, //?? originalData.title,
      // Needs to be ISO string without milliseconds
      dueDate: dueDate, // ? formatDate(dueDate) : formatDate(originalData.dueDate),
      body: description,
      assignedTo: assignedTo,
      completed,
    });
  },
});

function formatDate(date: string) {
  return new Date(date).toISOString().split('.')[0] + 'Z';
}
