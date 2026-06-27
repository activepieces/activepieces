import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const slackListUserReactions = createAction({
  auth: slackAuth,
  name: 'slack_list_user_reactions',
  displayName: 'List User Reactions',
  description: 'List the items a user has reacted to.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists all items (messages and files) a user has reacted to, paging through every result; defaults to the authenticated user when no user is given. Use this to enumerate everything a user reacted to; use Get Reactions to inspect the reactions on one specific message or file. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    user: Property.ShortText({
      displayName: 'User ID',
      description:
        'Show reactions made by this user ID (e.g. U0123ABCD). Leave empty to use the authenticated user.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of items to return per page (1-1000). Defaults to 100.',
      required: false,
    }),
  },
  async run(context) {
    const token = getBotToken(context.auth as SlackAuthValue);
    const client = new WebClient(token);
    const { user, limit } = context.propsValue;

    const items = [];
    let cursor: string | undefined;
    do {
      const page = await client.reactions.list({
        user: user || undefined,
        limit: limit ?? 100,
        cursor,
      });
      if (page.items) {
        items.push(...page.items);
      }
      cursor = page.response_metadata?.next_cursor || undefined;
    } while (cursor);

    return { items, count: items.length };
  },
});
