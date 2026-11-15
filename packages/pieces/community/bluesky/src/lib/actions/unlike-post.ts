import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { unlikePostOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';
import { blueskyCompose } from '../common/compose';

export const unlikePost = createAction({
  auth: blueskyAuth,
  name: 'unlike_post',
  classification: 'WRITE',
  displayName: 'Unlike Post',
  description: 'Remove your like from a post',
  audience: 'both',
  outputSchema: unlikePostOutputSchema,
  aiMetadata: {
    description:
      'Removes the connected account\'s like from a Bluesky post given its bsky.app link or AT-URI. Use to undo Like Post. Idempotent: when the post is not liked it changes nothing and returns removed=false.',
    idempotent: true,
  },
  props: {
    post: blueskyProps.postInputProperty(),
  },
  async run({ auth, propsValue }) {
    blueskyRefs.parsePostInput(propsValue.post);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'unlike the post',
      fn: async (agent) => {
        const post = await blueskyCompose.fetchPostView({ agent, input: propsValue.post });
        const likeUri = post.viewer?.like;
        if (likeUri) {
          await agent.deleteLike(likeUri);
        }
        return { removed: Boolean(likeUri), postUri: post.uri, likeUri: likeUri ?? null };
      },
    });
  },
});
