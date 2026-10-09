import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { undoRepostOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';
import { blueskyCompose } from '../common/compose';

export const undoRepost = createAction({
  auth: blueskyAuth,
  name: 'undo_repost',
  classification: 'WRITE',
  displayName: 'Undo Repost',
  description: 'Remove your repost of a post',
  audience: 'both',
  outputSchema: undoRepostOutputSchema,
  aiMetadata: {
    description:
      'Removes the connected account\'s repost of a Bluesky post given the original post\'s bsky.app link or AT-URI. Use to undo Repost Post. Idempotent: when the post is not reposted it changes nothing and returns removed=false.',
    idempotent: true,
  },
  props: {
    post: blueskyProps.postInputProperty(),
  },
  async run({ auth, propsValue }) {
    blueskyRefs.parsePostInput(propsValue.post);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'undo the repost',
      fn: async (agent) => {
        const post = await blueskyCompose.fetchPostView({ agent, input: propsValue.post });
        const repostUri = post.viewer?.repost;
        if (repostUri) {
          await agent.deleteRepost(repostUri);
        }
        return { removed: Boolean(repostUri), postUri: post.uri, repostUri: repostUri ?? null };
      },
    });
  },
});
