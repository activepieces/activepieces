import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupDeleteComment = createAction({
  auth: clickupAuth,
  name: 'clickup_delete_comment',
  description: 'Delete a comment in ClickUp',
  audience: 'ai',
  aiMetadata: {
    description:
      'Delete a ClickUp comment identified by its comment ID. Obtain the comment ID from Get Task Comments or Get Threaded Comments. Removing an already-deleted comment is treated as a no-op, so this is safe to retry.',
    idempotent: true,
  },
  displayName: 'Delete Comment',
  props: {
    comment_id: Property.ShortText({
      description:
        'The ID of the comment to delete (from Get Task Comments or Get Threaded Comments)',
      displayName: 'Comment ID',
      required: true,
    }),
  },
  async run(configValue) {
    const { comment_id } = configValue.propsValue;

    const response = await callClickUpApi(
      HttpMethod.DELETE,
      `comment/${comment_id}`,
      getAccessTokenOrThrow(configValue.auth),
      undefined
    );

    return response.body;
  },
});
