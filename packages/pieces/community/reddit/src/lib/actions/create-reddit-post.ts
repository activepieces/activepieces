import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { redditAuth } from '../../index';

export const createRedditPost = createAction({
  auth: redditAuth,
  name: 'createRedditPost',
  displayName: 'Create Post',
  description: 'Submit a new self (text) post to a subreddit.',
  props: {
    subreddit: Property.ShortText({
      displayName: 'Subreddit',
      description: 'The subreddit to post in (without r/).',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title of the Reddit post.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'Text content of the post.',
      required: true,
    }),
  },
  async run(context) {
    const { subreddit, title, content } = context.propsValue;

    const url = 'https://oauth.reddit.com/api/submit';

    const payload = new URLSearchParams({
      api_type: 'json',
      sr: subreddit,
      title,
      text: content,
      kind: 'self',
    });

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url,
      headers: {
        'Authorization': `Bearer ${context.auth.access_token}`,
        'User-Agent': 'ActivePieces Reddit Client',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: payload.toString(),
    });

    if (response.status !== 200) {
      return {
        error: `Failed to create post: ${response.status}`,
        details: response.body,
      };
    }

    return response.body;
  },
});
