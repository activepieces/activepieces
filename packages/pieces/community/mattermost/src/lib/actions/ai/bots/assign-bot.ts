import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostAssignBotOutputSchema } from '../../../output-schemas';

export const assignBotAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_assign_bot',
  outputSchema: mattermostAssignBotOutputSchema,
  displayName: 'Assign Bot Owner',
  description: 'Makes a user the owner of a bot.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Transfers ownership of a bot to a user; pass "me" for the connected account. Takes the bot\'s user ID from Create Bot or List Bots. Needs the manage_bots permission.',
    idempotent: true,
  },
  props: {
    botUserId: Property.ShortText({
      displayName: 'Bot User ID',
      description: 'The bot\'s user ID (26 characters). Use Create Bot or List Bots to find it.',
      required: true,
    }),
    userId: mattermostAiProps.userId({
      required: true,
      displayName: 'New Owner User ID',
    }),
  },
  async run(context) {
    const { botUserId, userId } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/bots/${encodeURIComponent(botUserId)}/assign/${encodeURIComponent(userId)}`,
    });
  },
});
