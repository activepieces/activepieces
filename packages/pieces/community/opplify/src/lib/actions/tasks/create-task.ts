import { createAction, Property } from '@activepieces/pieces-framework';
import { opplifyAuth } from '../../common/auth';
import { opplifyClient } from '../../common/client';
import { taskPriorityDropdown, userDropdown } from '../../common/props';

export const createTaskAction = createAction({
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Creates a task associated with a lead.',
  auth: opplifyAuth,
  requireAuth: true,
  props: {
    leadId: Property.ShortText({
      displayName: 'Lead ID',
      description: 'The ID of the lead',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Task title',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Task description',
      required: false,
    }),
    priority: taskPriorityDropdown,
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'ISO 8601 date',
      required: false,
    }),
    assignedTo: userDropdown,
  },
  async run(context) {
    const externalId = await context.project.externalId() || ""; const ctx = { projectId: context.project.id, externalId, baseUrl: process.env["AP_OPPLIFY_BASE_URL"] || "http://host.docker.internal:3001" };
    const client = opplifyClient(ctx);
    return await client.callAction('tasks/create', {
      leadId: context.propsValue.leadId,
      title: context.propsValue.title,
      description: context.propsValue.description,
      priority: context.propsValue.priority,
      dueDate: context.propsValue.dueDate,
      assignedTo: context.propsValue.assignedTo,
    });
  },
});
