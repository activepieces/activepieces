import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../../';

export const createClickupTaskComment = createAction({
  auth: clickupAuth,
  name: 'create_task_comments',
  description: 'Creates a comment on a task in ClickUp',
  displayName: 'Create Task Comment',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    space_id: clickupCommon.space_id(),
    list_id: clickupCommon.list_id(),
    task_id: clickupCommon.task_id(),
    comment: Property.LongText({
      description: 'Comment to make on the task',
      displayName: 'Comment',
      required: true,
    }),
    assignee_id: clickupCommon.assignee_id(),
  },
  async run(configValue) {
    const { task_id, comment, assignee_id } = configValue.propsValue;

    if (!assignee_id) {
      const user_request = await callClickUpApi(
        HttpMethod.GET,
        `/user`,
        getAccessTokenOrThrow(configValue.auth),
        {}
      );
  
      if (user_request.body['user'] === undefined) {
        throw 'Please connect to your ClickUp account';
      }

      assignee_id = user_request.body['user']['id'];
    }

    const response = await callClickUpApi(
      HttpMethod.POST,
      `/task/${task_id}/comment`,
      getAccessTokenOrThrow(configValue.auth),
      {
        comment_text: comment,
        assignee: assignee_id,
        notify_all: true,
      }
    );

    return response.body;
  },
});
