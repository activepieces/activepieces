import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupGetTaskComments = createAction({
  auth: clickupAuth,
  name: 'clickup_get_task_comments',
  description: 'Gets comments from a task in ClickUp',
  audience: 'ai',
  aiMetadata: {
    description:
      'Read-only: retrieve the comments on a ClickUp task by its task ID. Use to review discussion or activity on a known task, or to obtain a comment ID to feed Update Comment, Delete Comment, or Create Threaded Comment. Does not modify anything and is safe to call repeatedly.',
    idempotent: true,
  },
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
      `task/${task_id}/comment`,
      getAccessTokenOrThrow(configValue.auth),
      {}
    );

    return response.body;
  },
});
