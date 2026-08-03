import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi } from '../../common';
import { clickupAuth } from '../../auth';

export const clickupUpdateComment = createAction({
  auth: clickupAuth,
  name: 'clickup_update_comment',
  description: 'Update an existing comment in ClickUp',
  audience: 'ai',
  aiMetadata: {
    description:
      'Edit a ClickUp comment identified by its comment ID: change its text, reassign it, or mark it resolved/unresolved. Obtain the comment ID from Get Task Comments or Get Threaded Comments. This sets the comment to the supplied end state, so repeating the same update is idempotent.',
    idempotent: true,
  },
  displayName: 'Update Comment',
  props: {
    comment_id: Property.ShortText({
      description:
        'The ID of the comment to update (from Get Task Comments or Get Threaded Comments)',
      displayName: 'Comment ID',
      required: true,
    }),
    comment_text: Property.LongText({
      description: 'The new text of the comment',
      displayName: 'Comment Text',
      required: true,
    }),
    assignee: Property.Number({
      description: 'The user ID to assign the comment to',
      displayName: 'Assignee',
      required: false,
    }),
    resolved: Property.Checkbox({
      description: 'Whether the comment is resolved',
      displayName: 'Resolved',
      required: false,
    }),
  },
  async run(configValue) {
    const { comment_id, comment_text, assignee, resolved } =
      configValue.propsValue;

    const body: Record<string, unknown> = {
      comment_text,
    };
    if (assignee !== undefined && assignee !== null) {
      body['assignee'] = assignee;
    }
    if (resolved !== undefined && resolved !== null) {
      body['resolved'] = resolved;
    }

    const response = await callClickUpApi(
      HttpMethod.PUT,
      `comment/${comment_id}`,
      getAccessTokenOrThrow(configValue.auth),
      body
    );

    return response.body;
  },
});
