import {
  Property,
  createAction,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import { makeClient, reformatDate } from '../common';
import { moxieCRMAuth } from '../..';

export const moxieCreateTaskAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_create_task',
  displayName: 'Create a Task',
  description: 'Create a task in project.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    clientName: Property.Dropdown({
      displayName: 'Client Name',
      description: 'Exact match of a client name in your CRM',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }

        const client = await makeClient(
          auth as PiecePropValueSchema<typeof moxieCRMAuth>
        );
        const clients = await client.listClients();
        return {
          disabled: false,
          options: clients.map((client) => {
            return {
              label: client.name,
              value: client.name,
            };
          }),
        };
      },
    }),
    projectName: Property.Dropdown({
      displayName: 'Project Name',
      description: 'Exact match of a project that is owned by the client.',
      required: true,
      refreshers: ['clientName'],
      options: async ({ auth, clientName }) => {
        if (!auth || !clientName) {
          return {
            disabled: true,
            placeholder: 'Connect your account first and select client',
            options: [],
          };
        }
        const client = await makeClient(
          auth as PiecePropValueSchema<typeof moxieCRMAuth>
        );
        const projects = await client.searchProjects(clientName as string);
        return {
          disabled: false,
          options: projects.map((project) => {
            return {
              label: project.name,
              value: project.name,
            };
          }),
        };
      },
    }),
    status: Property.Dropdown({
      displayName: 'Status',
      required: true,
      defaultValue: 'Not Started',
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your account first',
            options: [],
          };
        }
        const client = await makeClient(
          auth as PiecePropValueSchema<typeof moxieCRMAuth>
        );
        const stages = await client.listProjectTaskStages();
        return {
          disabled: false,
          options: stages.map((stage) => {
            return {
              label: stage.label,
              value: stage.label,
            };
          }),
        };
      },
    }),
    description: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    startDate: Property.DateTime({
      displayName: 'Start Date',
      required: false,
      description: 'ISO 8601 format date i.e. 2023-07-20',
    }),
    dueDate: Property.DateTime({
      displayName: 'Due Date',
      required: false,
      description: 'ISO 8601 format date i.e. 2023-07-20',
    }),

    priority: Property.Number({
      displayName: 'Priority',
      required: false,
      description: 'Numeric priority for sorting in kanban.',
    }),
    tasks: Property.Array({
      displayName: 'Subtasks',
      required: false,
    }),
    assignedTo: Property.Array({
      displayName: 'Assigned To',
      required: false,
      description: 'email addresses of users in the workspace.',
    }),
    customValues: Property.Object({
      displayName: 'Custom Values',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { name, clientName, projectName, status, description, priority } =
      propsValue;
    const dueDate = reformatDate(propsValue.dueDate) as string;
    const startDate = reformatDate(propsValue.startDate) as string;
    const tasks = (propsValue.tasks as string[]) || [];
    const assignedTo = (propsValue.assignedTo as string[]) || [];
    const customValues =
      (propsValue.customValues as Record<string, string>) || {};
    const client = await makeClient(auth);
    return await client.createTask({
      name,
      clientName,
      projectName,
      status,
      description,
      dueDate,
      startDate,
      priority,
      tasks,
      assignedTo,
      customValues,
    });
  },
});
