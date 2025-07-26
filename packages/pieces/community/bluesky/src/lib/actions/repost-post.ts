import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../..';
import { BskyAgent } from '@atproto/api';

function isNonEmptyString(str: string | undefined): boolean {
  return typeof str === 'string' && str.trim().length > 0;
}

export const repostPost = createAction({
  auth: blueskyAuth,
  name: 'repost-post',
  displayName: 'Repost Post',
  description: 'Repost (boost) a specific post by its URI and CID.',
  props: {
    uri: Property.ShortText({
      displayName: 'Post URI',
      description: 'The URI of the post to repost.',
      required: true,
    }),
    cid: Property.ShortText({
      displayName: 'Post CID',
      description: 'The CID (content hash) of the post to repost.',
      required: true,
    }),
  },
  async run(context) {
    try {
      const { serviceUrl, identifier, password } = context.auth;
      const { uri, cid } = context.propsValue;
      if (!isNonEmptyString(uri) || !isNonEmptyString(cid)) {
        return { error: 'Both URI and CID are required and must be non-empty.' };
      }
      const agent = new BskyAgent({ service: serviceUrl });
      await agent.login({ identifier, password });
      const response = await agent.repost(uri, cid);
      return response;
    } catch (error: any) {
      return { error: error.message || 'Failed to repost post.' };
    }
  },
}); 