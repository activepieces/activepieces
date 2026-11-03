import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { aiLikeOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';
import { blueskyCompose } from '../common/compose';

export const blueskyLikePost = createAction({
  auth: blueskyAuth,
  name: 'bluesky_like_post',
  classification: 'WRITE',
  displayName: 'Like Post (AI)',
  description: 'Like a post, or return the existing like',
  audience: 'ai',
  outputSchema: aiLikeOutputSchema,
  aiMetadata: {
    description:
      'Likes a Bluesky post given its bsky.app link or AT-URI, and returns the existing like if the account already liked it. Use Unlike Post to undo. Idempotent: a repeat call does not create a second like.',
    idempotent: true,
  },
  props: {
    post: blueskyProps.postInputProperty(),
  },
  async run({ auth, propsValue }) {
    blueskyRefs.parsePostInput(propsValue.post);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'like the post',
      fn: async (agent) => {
        const post = await blueskyCompose.fetchPostView({ agent, input: propsValue.post });
        const existing = post.viewer?.like;
        const likeUri = existing ?? (await agent.like(post.uri, post.cid)).uri;
        return {
          likeUri,
          postUri: post.uri,
          postCid: post.cid,
          postUrl: blueskyRefs.postWebUrl({ uri: post.uri, handle: post.author.handle }),
          alreadyLiked: Boolean(existing),
        };
      },
    });
  },
});
