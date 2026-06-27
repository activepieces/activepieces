import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { requireUserToken, SlackAuthValue } from '../common/auth-helpers';

export const slackSearchMessagesAiAction = createAction({
  auth: slackAuth,
  name: 'slack_search_messages',
  displayName: 'Search Messages',
  description: 'Search the workspace for messages matching a query.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Search across the workspace for messages matching a query string, paging through every match; read-only and repeatable. Requires a user token (search is unavailable to bot tokens). Use this to find messages anywhere by content; use Get Channel History when you already know the channel, or Search All to also include files.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description:
        'Search query, supporting Slack search operators (e.g. "in:#general from:@jane budget").',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const userToken = requireUserToken(auth as SlackAuthValue);
    const client = new WebClient(userToken);
    const matches = [];

    let cursor = '*';
    do {
      const page = await client.search.messages({
        query: propsValue.query,
        count: 100,
        // @ts-expect-error TS2353 - SDK is not aware cursor is actually supported
        cursor,
      });
      if (page.messages?.matches) {
        matches.push(...page.messages.matches);
      }
      // @ts-expect-error TS2353 - SDK is not aware next_cursor is actually returned
      cursor = page.messages?.pagination?.next_cursor;
    } while (cursor);

    return matches;
  },
});
