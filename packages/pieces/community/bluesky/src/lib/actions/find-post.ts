import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../..';
import { BskyAgent } from '@atproto/api';

function isNonEmptyString(str: string | undefined): boolean {
  return typeof str === 'string' && str.trim().length > 0;
}

export const findPost = createAction({
  auth: blueskyAuth,
  name: 'find-post',
  displayName: 'Find Post',
  description: 'Retrieve a single post\'s details using its URL/URI.',
  props: {
    uri: Property.ShortText({
      displayName: 'Post URI',
      description: 'The URI of the post to retrieve.',
      required: true,
    }),
  },
  async run(context) {
    try {
      const { serviceUrl, identifier, password } = context.auth;
      const { uri } = context.propsValue;
      if (!isNonEmptyString(uri)) {
        return { error: 'Post URI is required and must be non-empty.' };
      }
      const agent = new BskyAgent({ service: serviceUrl });
      await agent.login({ identifier, password });
      const response = await agent.getPosts({ uris: [uri] });
      return response.data.posts[0] || { error: 'Post not found' };
    } catch (error: any) {
      return { error: error.message || 'Failed to find post.' };
    }
  },
}); 