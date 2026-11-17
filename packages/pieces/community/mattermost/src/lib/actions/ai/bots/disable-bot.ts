import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostDisableBotOutputSchema } from '../../../output-schemas';

export const disableBotAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_disable_bot',
  outputSchema: mattermostDisableBotOutputSchema,
  displayName: 'Disable Bot',
  description: 'Disables a bot account.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Disables a bot account so it can no longer post or authenticate; Enable Bot reverses it. Takes the bot\'s user ID from Create Bot or List Bots. Needs the manage_bots permission. A bot that owns itself (made by Convert User To Bot) must first get another owner with Assign Bot, or this call never returns.',
    idempotent: true,
  },
  props: {
    botUserId: Property.ShortText({
      displayName: 'Bot User ID',
      description: 'The bot\'s user ID (26 characters). Use Create Bot or List Bots to find it.',
      required: true,
    }),
  },
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/bots/${encodeURIComponent(context.propsValue.botUserId)}/disable`,
    });
  },
});
