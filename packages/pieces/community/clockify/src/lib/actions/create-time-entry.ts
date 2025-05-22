import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { clockifyAuth } from '../../index';

export const createTaskAction = createAction({
  auth: clockifyAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a new task in Clockify',
  props: {
    workspaceId: Property.ShortText({
      displayName: 'Workspace ID',
      required: true,
    }),
    projectId: Property.ShortText({
      displayName: 'Project ID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Task Name',
      required: true,
    }),
    assigneeIds: Property.Array({
      displayName: 'Assignee IDs',
      required: false,
      description: 'List of user IDs to assign to the task.',
    }),
    budgetEstimate: Property.Number({
      displayName: 'Budget Estimate (ms)',
      required: false,
      description: 'Estimated task budget in milliseconds.',
    }),
    estimate: Property.ShortText({
      displayName: 'Estimate (ISO-8601 Duration)',
      required: false,
      description: 'Estimated task duration (e.g., PT1H30M).',
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Done', value: 'DONE' },
          { label: 'All', value: 'ALL' },
        ],
      },
    }),
    userGroupIds: Property.Array({
      displayName: 'User Group IDs',
      required: false,
      description: 'User group IDs assigned to this task.',
    }),
    containsAssignee: Property.Checkbox({
      displayName: 'Contains Assignee',
      required: false,
      defaultValue: true,
      description: 'Whether the task contains assignees.',
    }),
  },
  async run(context) {
    const {
      workspaceId,
      projectId,
      name,
      assigneeIds,
      budgetEstimate,
      estimate,
      status,
      userGroupIds,
      containsAssignee,
    } = context.propsValue;

    const apiKey = context.auth as string;

    const body = {
      name: name,
      ...(assigneeIds !== undefined ? { assigneeIds: assigneeIds as string[] } : {}),
      ...(budgetEstimate !== undefined ? { budgetEstimate } : {}),
      ...(estimate ? { estimate } : {}),
      ...(status ? { status } : {}),
      ...(userGroupIds !== undefined ? { userGroupIds: userGroupIds as string[] } : {}),
    };

    const queryParam = containsAssignee === false ? '?contains-assignee=false' : '';

    return await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/workspaces/${workspaceId}/projects/${projectId}/tasks${queryParam}`,
      body
    );
  },
});
