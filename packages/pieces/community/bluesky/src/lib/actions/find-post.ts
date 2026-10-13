import { createAction } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { findPostOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';

export const findPost = createAction({
  auth: blueskyAuth,
  name: 'findPost',
  classification: 'READ',
  displayName: 'Find Post',
  description: 'Get detailed information about a specific post',
  audience: 'both',
  outputSchema: findPostOutputSchema,
  aiMetadata: {
    description:
      'Retrieves a single Bluesky post with its content, author, and engagement counts (likes, reposts, replies, quotes), given a bsky.app post URL or AT-URI (handle or DID form). Use to look up the current state or metadata of a known post; use Get Posts to fetch several at once. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    postUrl: blueskyProps.postUrlProperty,
  },
  async run({ auth, propsValue }) {
    blueskyRefs.parsePostInput(propsValue.postUrl);
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'find the post',
      fn: async (agent) => {
        const ref = await blueskyRefs.resolvePostRef({ agent, input: propsValue.postUrl });
        const response = await agent.getPosts({ uris: [ref.uri] });
        const post = response.data.posts[0];
        if (!post) {
          throw new Error('Post not found or not accessible. It may have been deleted, or its author blocks this account.');
        }
        return {
          success: true,
          uri: ref.uri,
          url: blueskyRefs.postWebUrl({ uri: post.uri, handle: post.author.handle }),
          cid: post.cid,
          record: post.record,
          author: post.author,
          indexedAt: post.indexedAt,
          replyCount: post.replyCount || 0,
          repostCount: post.repostCount || 0,
          likeCount: post.likeCount || 0,
          quoteCount: post.quoteCount || 0,
          embed: post.embed,
          labels: post.labels,
          threadgate: post.threadgate,
          viewer: post.viewer,
          retrievedAt: new Date().toISOString(),
        };
      },
    });
  },
});
