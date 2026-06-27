import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { clickupCommon, callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupCreateTaskComment = createAction({
  auth: clickupAuth,
  name: 'clickup_create_task_comment',
  description: 'Creates a comment on a task in ClickUp',
  audience: 'ai',
  aiMetadata: {
    description:
      'Post a new comment on a ClickUp task identified by its task ID. Use this to add a discussion note or @-style update to a task; to read existing comments use Get Task Comments, and to reply within a thread use Create Threaded Comment. Each call adds a distinct comment, so it is not idempotent; if no assignee is given the comment is attributed to the authenticated user.',
    idempotent: false,
  },
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
    assignee_id: clickupCommon.single_assignee_id(
      false,
      'Assignee Id',
      'ID of assignee for Task Comment'
    ),
  },
  async run(configValue) {
    const { task_id, comment } = configValue.propsValue;

    let assignee_id = configValue.propsValue.assignee_id;

    if (!assignee_id) {
      const user_request = await callClickUpApi(
        HttpMethod.GET,
        `user`,
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
      `task/${task_id}/comment`,
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
