import { createAction } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const slackListCustomEmoji = createAction({
  auth: slackAuth,
  name: 'slack_list_custom_emoji',
  displayName: 'List Custom Emoji',
  description: 'List the custom emoji of the workspace.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists the workspace's custom emoji as a name-to-image-URL map (aliases point to their target with an 'alias:' value). Use this to discover available custom emoji names, e.g. before adding a reaction. Read-only and idempotent.",
    idempotent: true,
  },
  props: {},
  async run(context) {
    const token = getBotToken(context.auth as SlackAuthValue);
    const client = new WebClient(token);
    const response = await client.emoji.list();
    return {
      emoji: response.emoji ?? {},
      count: Object.keys(response.emoji ?? {}).length,
    };
  },
});
