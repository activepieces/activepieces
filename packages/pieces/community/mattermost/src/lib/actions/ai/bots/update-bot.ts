import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostAssignBotOutputSchema } from '../../../output-schemas';

export const updateBotAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_update_bot',
  outputSchema: mattermostAssignBotOutputSchema,
  displayName: 'Update Bot',
  description: 'Changes a bot\'s username, display name or description.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes a bot\'s username, display name or description; only the fields given are changed. Takes the bot\'s user ID from Create Bot or List Bots. Needs the manage_bots permission.',
    idempotent: true,
  },
  props: {
    botUserId: Property.ShortText({
      displayName: 'Bot User ID',
      description: 'The bot\'s user ID (26 characters). Use Create Bot or List Bots to find it.',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      description: 'New unique username: lowercase letters, numbers, ".", "-" and "_".',
      required: false,
    }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'New name shown for the bot.',
      required: false,
    }),
    description: Property.ShortText({
      displayName: 'Description',
      description: 'New description of what the bot is for.',
      required: false,
    }),
  },
  async run(context) {
    const { botUserId, username, displayName, description } = context.propsValue;
    if (username === undefined && displayName === undefined && description === undefined) {
      throw new Error('Set at least one of Username, Display Name or Description.');
    }
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/bots/${encodeURIComponent(botUserId)}`,
      body: {
        ...(username !== undefined ? { username } : {}),
        ...(displayName !== undefined ? { display_name: displayName } : {}),
        ...(description !== undefined ? { description } : {}),
      },
    });
  },
});
