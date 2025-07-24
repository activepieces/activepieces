import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../..';
import { BskyAgent } from '@atproto/api';

function isNonEmptyString(str: string | undefined): boolean {
  return typeof str === 'string' && str.trim().length > 0;
}

export const findThread = createAction({
  auth: blueskyAuth,
  name: 'find-thread',
  displayName: 'Find Thread',
  description: 'Retrieve a full thread, including parent posts and replies, up to 100 deep.',
  props: {
    uri: Property.ShortText({
      displayName: 'Thread Root Post URI',
      description: 'The URI of the root post of the thread.',
      required: true,
    }),
    depth: Property.Number({
      displayName: 'Depth',
      description: 'How deep to fetch replies (max 100).',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    try {
      const { serviceUrl, identifier, password } = context.auth;
      const { uri, depth } = context.propsValue;
      if (!isNonEmptyString(uri)) {
        return { error: 'Thread root post URI is required and must be non-empty.' };
      }
      const safeDepth = Math.min(depth || 100, 100);
      const agent = new BskyAgent({ service: serviceUrl });
      await agent.login({ identifier, password });
      const response = await agent.getPostThread({ uri, depth: safeDepth });
      return response;
    } catch (error: any) {
      return { error: error.message || 'Failed to find thread.' };
    }
  },
}); 