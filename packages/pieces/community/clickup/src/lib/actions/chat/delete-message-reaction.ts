import { createAction } from '@activepieces/pieces-framework';
import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../../';

export const deleteClickupMessageReaction = createAction({
  auth: clickupAuth,
  name: 'delete_message_reaction',
  description: 'Deletes a reaction from a message in a ClickUp channel',
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
