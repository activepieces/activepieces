import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostAssignBotOutputSchema } from '../../../output-schemas';

export const enableBotAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_enable_bot',
  outputSchema: mattermostAssignBotOutputSchema,
  displayName: 'Enable Bot',
  description: 'Re-enables a disabled bot account.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Re-enables a disabled bot account; the reverse of Disable Bot. Takes the bot\'s user ID from Create Bot or List Bots. Needs the manage_bots permission.',
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
      path: `/bots/${encodeURIComponent(context.propsValue.botUserId)}/enable`,
    });
  },
});
