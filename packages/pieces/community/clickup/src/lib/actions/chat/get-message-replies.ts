import { createAction } from '@activepieces/pieces-framework';
import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../auth';

export const getClickupMessageReplies = createAction({
  auth: clickupAuth,
  name: 'get_message_replies',
  description: 'Gets the replies of a message in a ClickUp channel',
  audience: 'both',
  aiMetadata: { description: 'Read-only: retrieve the threaded replies to a specific Chat message in a ClickUp workspace, given the workspace and message IDs. Use to read a reply thread; does not post anything. Safe to call repeatedly.', idempotent: true },
  displayName: 'Get Message Replies',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    message_id: Property.ShortText({
      description: 'ID of the message to get replies for',
      displayName: 'Message ID',
      required: true,
    }),
  },

  async run(configValue) {
    const { workspace_id, message_id } = configValue.propsValue;
    const response = await callClickUpApi3(
      HttpMethod.GET,
      `workspaces/${workspace_id}/chat/messages/${message_id}/replies`,
      getAccessTokenOrThrow(configValue.auth),
      {},
      {}
    );
    return response.body;
  },
});
