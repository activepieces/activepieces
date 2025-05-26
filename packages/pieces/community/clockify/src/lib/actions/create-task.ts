import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest, fetchWorkspaces, fetchProjects } from '../common';
import { clockifyAuth } from '../../index';

export const createTaskAction = createAction({
  auth: clockifyAuth,
  name: 'create_task',
  displayName: 'Create Task',
  description: 'Create a new task in Clockify',
  props: {
    workspaceId: Property.Dropdown({
      displayName: 'Workspace',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please connect your Clockify account',
            options: [],
          };
        }

        const apiKey = auth as string;
        const workspaces = await fetchWorkspaces(apiKey);

        return {
          options: workspaces.map((workspace: any) => ({
            label: workspace.name,
            value: workspace.id,
          })),
        };
      },
    }),
    projectId: Property.Dropdown({
      displayName: 'Project',
      required: true,
      refreshers: ['workspaceId'],
      options: async ({ auth, workspaceId }) => {
        if (!auth || !workspaceId) {
          return {
            disabled: true,
            placeholder: 'Please select a workspace first',
            options: [],
          };
        }

        const apiKey = auth as string;
        const projects = await fetchProjects(apiKey, workspaceId as string);

        return {
          options: projects.map((project: any) => ({
            label: project.name,
            value: project.id,
          })),
        };
      },
    }),
    taskName: Property.ShortText({
      displayName: 'Task Name',
      required: true,
    }),
    assigneeIds: Property.Array({
      displayName: 'Assignee IDs',
      required: false,
      description: 'List of user IDs to assign this task to.',
    }),
    budgetEstimate: Property.Number({
      displayName: 'Budget Estimate (ms)',
      required: false,
      description: 'Estimated task budget in milliseconds.',
    }),
    estimate: Property.ShortText({
      displayName: 'Estimate (ISO-8601)',
      required: false,
      description: 'Estimated task duration (e.g., PT1H30M for 1 hour 30 minutes).',
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
      description: 'List of user group IDs assigned to the task.',
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
      taskName,
      assigneeIds,
      budgetEstimate,
      estimate,
      status,
      userGroupIds,
      containsAssignee,
    } = context.propsValue;

    const apiKey = context.auth as string;

    const body = {
      name: taskName,
      ...(assigneeIds ? { assigneeIds: assigneeIds as string[] } : {}),
      ...(budgetEstimate ? { budgetEstimate: budgetEstimate as number } : {}),
      ...(estimate ? { estimate: estimate as string } : {}),
      ...(status ? { status: status as 'ACTIVE' | 'DONE' | 'ALL' } : {}),
      ...(userGroupIds ? { userGroupIds: userGroupIds as string[] } : {}),
    };

    const queryParams = containsAssignee === false ? '?contains-assignee=false' : '';

    const result = await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/workspaces/${workspaceId}/projects/${projectId}/tasks${queryParams}`,
      body
    );

    return result;
  },
});
