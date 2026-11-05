import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { redditAuth } from '../auth';
import { redditApi } from '../common/client';
import { createRedditPostOutputSchema } from '../output-schemas';

export const createRedditPost = createAction({
  auth: redditAuth,
  name: 'createRedditPost',
  outputSchema: createRedditPostOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Post',
  description: 'Submit a new self (text) post to a subreddit.',
  audience: 'human',
  aiMetadata: { description: 'Submits a new self (text) post to a subreddit on behalf of the authenticated account. Use it to publish original text content; it cannot post links, images, or media. Requires the target subreddit, a title, and the text body. Not idempotent — each call creates a separate post.', idempotent: false },
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
    return redditApi.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      allowJsonErrors: true,
      path: '/api/submit',
      form: { api_type: 'json', sr: subreddit, title, text: content, kind: 'self' },
    });
  },
});
