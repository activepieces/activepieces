import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient, reformatDate } from '../common';
import { moxieDropdowns } from '../common/dropdowns';
import { moxieInput } from '../common/props';
import { moxieCRMAuth } from '../auth';
import { createTaskActionOutputSchema } from '../output-schemas';

export const moxieCreateTaskAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_create_task',
  classification: 'WRITE',
  displayName: 'Create a Task',
  description: 'Create a task in project.',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a task (deliverable) inside an existing project in Moxie CRM, with status, dates, priority, assignees, subtasks, and custom values. Use when adding work items to a project. Requires an exact-match client name and a project name owned by that client. Not idempotent: each call creates a separate task.',
    idempotent: false,
  },
  outputSchema: createTaskActionOutputSchema,
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    clientName: moxieDropdowns.clientName({
      required: true,
      displayName: 'Client Name',
      description: 'Exact match of a client name in your CRM',
    }),
    projectName: moxieDropdowns.projectByClientName({
      required: true,
      valueKey: 'name',
      displayName: 'Project Name',
      description: 'Exact match of a project that is owned by the client.',
    }),
    status: moxieDropdowns.taskStageLabelByProjectName({
      required: true,
      description: 'The stage to place the task in. Stages come from the selected project type.',
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
    const dueDate = reformatDate(propsValue.dueDate);
    const startDate = reformatDate(propsValue.startDate);
    const tasks = moxieInput.stringList({ value: propsValue.tasks, field: 'Subtasks' }) ?? [];
    const assignedTo = moxieInput.stringList({ value: propsValue.assignedTo, field: 'Assigned To' }) ?? [];
    const customValues = moxieInput.record({ value: propsValue.customValues, field: 'Custom Values' }) ?? {};
    const client = await makeClient(auth);
    return await client.createTask({
      name,
      clientName: moxieInput.requiredText({ value: clientName, field: 'Client Name' }),
      projectName: moxieInput.requiredText({ value: projectName, field: 'Project Name' }),
      status: moxieInput.requiredText({ value: status, field: 'Status' }),
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
