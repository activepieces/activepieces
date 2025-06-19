import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { redditAuth } from '../../';

export const retrieveRedditPost = createAction({
  auth: redditAuth,
  name: 'retrieveRedditPost',
  displayName: 'Retrieve Post',
  description: 'Fetch top posts in a subreddit with optional size limit.',
  props: {
    post_category: Property.StaticDropdown({
      displayName: 'Post Category',
      description: 'Select the category of posts to retrieve',
      required: true,
      defaultValue: 'hot',
      options: {
        options: [
          { label: 'Hot', value: 'hot' },
          { label: 'New', value: 'new' },
          { label: 'Top', value: 'top' },
          { label: 'Rising', value: 'rising' },
          { label: 'Controversial', value: 'controversial' },
        ],
      },
    }),
    subreddit: Property.ShortText({
      displayName: 'Subreddit',
      description: 'The subreddit to fetch posts from',
      required: true,
    }),
    size: Property.Number({
      displayName: 'Number of Posts',
      description: 'Number of posts to fetch (max 100)',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const baseUrl = `https://oauth.reddit.com/r/${context.propsValue.subreddit}/${context.propsValue.post_category}`;
    const limit = context.propsValue.size || 10;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: baseUrl,
      queryParams: {
        limit: limit.toString(),
      },
      headers: {
        'Authorization': `Bearer ${context.auth.access_token}`,
        'User-Agent': 'ActivePieces Reddit Client',
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    if (response.status !== 200) {
      throw new Error(`Reddit API error: ${response.status} ${JSON.stringify(response.body)}`);
    }

    return response.body;
  },
});
