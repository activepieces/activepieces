import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../..';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

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
      throw new Error("Missing user token, please re-authenticate")
    }
    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: 'https://slack.com/api/search.messages',
      queryParams: {
        query: propsValue.query,
        count: '100',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: userToken,
      },
    };

    let page = 1;
    let pageCount = Infinity;
    const matches = [];
    while (page < pageCount) {
      request.queryParams!.page = String(page);
      const response = await httpClient.sendRequest(request);

      if (!response.body.ok) {
        throw new Error(response.body.error);
      }
      pageCount = response.body['messages']['pagination']['page_count'];
      page += 1;
      matches.push(...response.body['messages']['matches']);
    }
    return matches;
  },
});
