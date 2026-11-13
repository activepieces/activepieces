import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { aiRepostOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';
import { blueskyCompose } from '../common/compose';

export const blueskyRepostPost = createAction({
  auth: blueskyAuth,
  name: 'bluesky_repost_post',
  classification: 'WRITE',
  displayName: 'Repost Post (AI)',
  description: 'Repost a post, or return the existing repost',
  audience: 'ai',
  outputSchema: aiRepostOutputSchema,
  aiMetadata: {
    description:
      'Reposts a Bluesky post to the connected account given its bsky.app link or AT-URI, and returns the existing repost if it was already reposted. Use Undo Repost to undo; use Create Post with a quote to add a comment. Idempotent: a repeat call does not create a second repost.',
    idempotent: true,
  },
  props: {
    post: blueskyProps.postInputProperty(),
  },
  async run({ auth, propsValue }) {
    blueskyRefs.parsePostInput(propsValue.post);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'repost the post',
      fn: async (agent) => {
        const post = await blueskyCompose.fetchPostView({ agent, input: propsValue.post });
        const existing = post.viewer?.repost;
        const repostUri = existing ?? (await agent.repost(post.uri, post.cid)).uri;
        return {
          repostUri,
          postUri: post.uri,
          postCid: post.cid,
          postUrl: blueskyRefs.postWebUrl({ uri: post.uri, handle: post.author.handle }),
          alreadyReposted: Boolean(existing),
        };
      },
    });
  },
});
