import { createAction } from '@activepieces/pieces-framework';
import { Property } from '@activepieces/pieces-framework';
import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { callClickUpApi3, clickupCommon } from '../../common';
import { clickupAuth } from '../../auth';
import { createMessageReactionOutputSchema } from '../../output-schemas';

export const createClickupMessageReaction = createAction({
  auth: clickupAuth,
  name: 'create_message_reaction',
  classification: 'WRITE',
  description: 'React to a chat message with an emoji.',
  audience: 'both',
  aiMetadata: { description: 'Add an emoji reaction to a Chat message in a ClickUp workspace, given the workspace and message IDs plus the emoji. Adding the same emoji again has no additional effect, but this is a write that changes the message state.', idempotent: false },
  displayName: 'Create Message Reaction',
  props: {
    workspace_id: clickupCommon.workspace_id(),
    message_id: Property.ShortText({
      description: 'Returned by Get Channel Messages or Create Message.',
      displayName: 'Message ID',
      required: true,
    }),
    emoji: Property.ShortText({
      description: "The emoji's name, without the colons.",
      displayName: 'Emoji',
      required: true,
      placeholder: 'e.g. thumbsup',
    }),
  },

  outputSchema: createMessageReactionOutputSchema,
  async run(configValue) {
    const { workspace_id, message_id, emoji } = configValue.propsValue;
    const response = await callClickUpApi3(
      HttpMethod.POST,
      `workspaces/${workspace_id}/chat/messages/${message_id}/reactions`,
      getAccessTokenOrThrow(configValue.auth),
      { reaction: emoji },
      {}
    );
    return response.body;
  },
});
