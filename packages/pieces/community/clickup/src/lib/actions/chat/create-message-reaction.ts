import { createAction } from '@activepieces/pieces-framework';
import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../../';

export const createClickupMessageReaction = createAction({
  auth: clickupAuth,
  name: 'create_message_reaction',
  description: 'Creates a reaction to a message in a ClickUp channel',
  displayName: 'Create Message Reaction',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    message_id: Property.ShortText({
      description: 'ID of the message to create reaction for',
      displayName: 'Message ID',
      required: true,
    }),
    emoji: Property.ShortText({
      description: 'Emoji to react with',
      displayName: 'Emoji',
      required: true,
    }),
  },

  async run(configValue) {
    const { workspace_id, message_id, emoji } = configValue.propsValue;
    const response = await callClickUpApi3(
      HttpMethod.POST,
      `workspaces/${workspace_id}/chat/messages/${message_id}/reactions`,
      getAccessTokenOrThrow(configValue.auth),
      { emoji },
      {}
    );
    return response.body;
  },
});
