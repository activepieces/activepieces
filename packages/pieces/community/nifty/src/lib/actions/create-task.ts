import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { nitfyCommon, callNitfyApi } from '../common';
import { niftyAuth } from '../auth';

export const createTask = createAction({
  name: 'create_task',
  auth: niftyAuth,
  displayName: 'Create Task',
  description: 'Create a task in nitfy',
  audience: 'both',
  aiMetadata: { description: 'Creates a new task in Nifty under a chosen project, status (task group), and optional milestone. Use when an agent needs to add a work item to a Nifty project; requires a task name and a target status. Not idempotent — each call creates a separate task even with identical input.', idempotent: false },
  props: {
    portfolio: nitfyCommon.portfolio,
    project: nitfyCommon.project,
    status: nitfyCommon.status,
    milestone: nitfyCommon.milestone,
    task_name: Property.ShortText({
      displayName: 'Task Name',
      required: true,
    }),
    task_description: Property.LongText({
        displayName: 'Task Description',
        required: false,
    }),
  },
  async run(context) {
    const authentication = context.auth;
    const accessToken = authentication.access_token;
    const status = context.propsValue.status;
    const task_name = context.propsValue.task_name;
    const task_description = context.propsValue.task_description;
    const milestone = context.propsValue.milestone;

    const response = (
      await callNitfyApi(HttpMethod.POST, 'tasks', accessToken, {
        name: task_name,
        task_group_id: status,
        description: task_description,
        milestone_id: milestone,
      })
    ).body;

    return [response];
  },
});
