import { createAction } from '@activepieces/pieces-framework';
import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../auth';

export const getClickupMessageReactions = createAction({
  auth: clickupAuth,
  name: 'get_message_reactions',
  description: 'Gets the reactions of a message in a ClickUp channel',
  audience: 'both',
  aiMetadata: { description: 'Read-only: list the emoji reactions on a specific Chat message in a ClickUp workspace, given the workspace and message IDs. Use to inspect who reacted and with what; does not modify the message. Safe to call repeatedly.', idempotent: true },
  displayName: 'Get Message Reactions',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    message_id: Property.ShortText({
      description: 'ID of the message to get reactions for',
      displayName: 'Message ID',
      required: true,
    }),
  },

  async run(configValue) {
    const { workspace_id, message_id } = configValue.propsValue;
    const response = await callClickUpApi3(
      HttpMethod.GET,
      `workspaces/${workspace_id}/chat/messages/${message_id}/reactions`,
      getAccessTokenOrThrow(configValue.auth),
      {},
      {}
    );
    return response.body;
  },
});
