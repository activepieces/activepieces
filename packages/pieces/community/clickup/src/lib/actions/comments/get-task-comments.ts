import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../../';

export const getClickupTaskComments = createAction({
  auth: clickupAuth,
  name: 'get_task_comments',
  description: 'Gets comments from a task in ClickUp',
  displayName: 'Get Task Comments',
  props: {
    task_id: Property.ShortText({
      description: 'The ID of the task to get',
      displayName: 'Task ID',
      required: true,
    }),
  },
  async run(configValue) {
    const { task_id } = configValue.propsValue;
    const response = await callClickUpApi(
      HttpMethod.GET,
      `/task/${task_id}/comment`,
      getAccessTokenOrThrow(configValue.auth),
      {}
    );

    return response.body;
  },
});
