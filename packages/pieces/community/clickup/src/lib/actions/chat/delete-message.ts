import { createAction } from '@activepieces/pieces-framework';
import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../auth';

export const deleteClickupMessage = createAction({
  auth: clickupAuth,
  name: 'delete_message',
  description: 'Deletes a message in a ClickUp channel',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a Chat message in a ClickUp workspace by its workspace and message IDs. This is a destructive write; once deleted the message cannot be recovered. Repeating the call on an already-deleted message has no further effect.', idempotent: false },
  displayName: 'Delete Message',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    message_id: Property.ShortText({
      description: 'ID of the message to delete',
      displayName: 'Message ID',
      required: true,
    }),
  },

  async run(configValue) {
    const { workspace_id, message_id } = configValue.propsValue;
    const response = await callClickUpApi3(
      HttpMethod.DELETE,
      `workspaces/${workspace_id}/chat/messages/${message_id}`,
      getAccessTokenOrThrow(configValue.auth),
      {},
      {}
    );
    return response.body;
  },
});
