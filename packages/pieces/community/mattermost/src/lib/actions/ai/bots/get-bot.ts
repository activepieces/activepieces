import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostAssignBotOutputSchema } from '../../../output-schemas';

export const getBotAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_bot',
  outputSchema: mattermostAssignBotOutputSchema,
  displayName: 'Get Bot',
  description: 'Gets a bot account by its user ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one bot account (username, display name, description, owner). Takes the bot\'s user ID from Create Bot or List Bots. A disabled bot is only found with Include Disabled set to "true".',
    idempotent: true,
  },
  props: {
    botUserId: Property.ShortText({
      displayName: 'Bot User ID',
      description: 'The bot\'s user ID (26 characters). Use Create Bot or List Bots to find it.',
      required: true,
    }),
    includeDeleted: mattermostAiProps.booleanFlag({
      required: false,
      displayName: 'Include Disabled',
      description: '"true" to also find the bot if it is disabled. Defaults to "false".',
    }),
  },
  async run(context) {
    const { botUserId, includeDeleted } = context.propsValue;
    const deleted = mattermostUtils.parseBoolean({ value: includeDeleted });
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/bots/${encodeURIComponent(botUserId)}`,
      query: deleted !== undefined ? { include_deleted: String(deleted) } : undefined,
    });
  },
});
