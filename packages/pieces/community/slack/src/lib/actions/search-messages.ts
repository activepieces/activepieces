import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../..';
import { WebClient } from '@slack/web-api';

export const searchMessages = createAction({
  name: 'searchMessages',
  displayName: 'Search messages',
  description: 'Searches for messages matching a query',
  auth: slackAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Search query',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const userToken = auth.data['authed_user']?.access_token;
    if (userToken === undefined) {
      throw new Error(JSON.stringify(
        {
          message: 'Missing user token, please re-authenticate'
        }
      ));
    }
    const client = new WebClient(userToken);
    const matches = [];

    // We can't use the usual "for await ... of" syntax with client.paginate
    // Because search.messages uses a bastardized version of cursor-based pagination
    // Where you need to pass * as first cursor
    // https://api.slack.com/methods/search.messages#arg_cursor
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
