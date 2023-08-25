import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { nitfyCommon, callNitfyApi } from '../common';
import { niftyAuth } from '../../index';

export const createTask = createAction({
  name: 'create_task',
  auth: niftyAuth,
  displayName: 'Create Task',
  description: 'Create a task in nitfy',
  props: {
    portfolio: nitfyCommon.portfolio,
    project: nitfyCommon.project,
    status: nitfyCommon.status,
    milestone: nitfyCommon.milestone,
    task_name: Property.ShortText({
      displayName: 'Task Name',
      required: true,
    }),
  },
  async run(context) {
    const authentication = context.auth;
    const accessToken = authentication.access_token;
    const status = context.propsValue.status;
    const task_name = context.propsValue.task_name;
    const milestone = context.propsValue.milestone;

    const response = (
      await callNitfyApi(HttpMethod.POST, 'tasks', accessToken, {
        name: task_name,
        task_group_id: status,
        milestone_id: milestone,
      })
    ).body;

    return [response];
  },
});
