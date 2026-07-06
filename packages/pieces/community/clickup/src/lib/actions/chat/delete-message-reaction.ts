import { createAction } from '@activepieces/pieces-framework';
import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../auth';

export const deleteClickupMessageReaction = createAction({
  auth: clickupAuth,
  name: 'delete_message_reaction',
  description: 'Deletes a reaction from a message in a ClickUp channel',
  audience: 'both',
  aiMetadata: { description: 'Remove a specific reaction from a Chat message in a ClickUp workspace, identified by workspace, message, and reaction IDs. This mutates the message; once the reaction is gone, repeating the call has no further effect, but it is a destructive operation against the current state.', idempotent: false },
  displayName: 'Delete Message Reaction',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    message_id: Property.ShortText({
      description: 'ID of the message to delete reaction from',
      displayName: 'Message ID',
      required: true,
    }),
    reaction_id: Property.ShortText({
      description: 'ID of the reaction to delete',
      displayName: 'Reaction ID',
      required: true,
    }),
  },

  async run(configValue) {
    const { workspace_id, message_id, reaction_id } = configValue.propsValue;
    const response = await callClickUpApi3(
      HttpMethod.DELETE,
      `workspaces/${workspace_id}/chat/messages/${message_id}/reactions/${reaction_id}`,
      getAccessTokenOrThrow(configValue.auth),
      {},
      {}
    );
    return response.body;
  },
});
