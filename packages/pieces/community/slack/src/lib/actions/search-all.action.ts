import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { requireUserToken, SlackAuthValue } from '../common/auth-helpers';

export const slackSearchAllAction = createAction({
  auth: slackAuth,
  name: 'slack_search_all',
  displayName: 'Search All',
  description: 'Search the workspace for both messages and files.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Search across the workspace for both messages and files matching a query string; read-only and repeatable. Requires a user token (search is unavailable to bot tokens). Use this when results may be either messages or files; use Search Messages when you only want messages.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description:
        'Search query, supporting Slack search operators (e.g. "in:#general budget").',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const userToken = requireUserToken(auth as SlackAuthValue);
    const client = new WebClient(userToken);

    const response = await client.search.all({
      query: propsValue.query,
      count: 100,
    });

    return {
      messages: response.messages?.matches ?? [],
      files: response.files?.matches ?? [],
      message_count: response.messages?.total ?? 0,
      file_count: response.files?.total ?? 0,
    };
  },
});
