import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { repostOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';
import { blueskyMappers } from '../common/mappers';

export const repostPost = createAction({
  auth: blueskyAuth,
  name: 'repostPost',
  classification: 'WRITE',
  displayName: 'Repost Post',
  description: 'Share someone else\'s post to your timeline',
  audience: 'human',
  outputSchema: repostOutputSchema,
  aiMetadata: {
    description:
      'Reposts an existing Bluesky post to the authenticated account\'s timeline, identified by an AT-URI / bsky.app post URL or selected from the recent timeline. Use to amplify another user\'s post. Not idempotent: each call creates a separate repost record.',
    idempotent: false,
  },
  props: {
    selectionMethod: blueskyProps.selectionMethodDropdown,
    postSelection: blueskyProps.timelinePostDropdown(),
    postUrl: Property.ShortText({
      displayName: 'Post URL',
      description: 'Paste the Bluesky post URL',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { selectionMethod, postSelection, postUrl } = propsValue;
    const input = blueskyProps.selectedPostInput({ selectionMethod, postSelection, postUrl });
    if (selectionMethod === 'manual') {
      blueskyRefs.parsePostInput(input);
    }
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'repost the post',
      fn: async (agent) => {
        const ref = await blueskyRefs.resolvePostRef({ agent, input });
        const postsResponse = await agent.getPosts({ uris: [ref.uri] });
        const post = postsResponse.data.posts[0];
        if (!post) {
          throw new Error('Post not found. Please check the URL and try again.');
        }
        const response = await agent.repost(ref.uri, post.cid);
        const text = blueskyMappers.recordText(post.record);
        const createdAt = post.record['createdAt'];
        return {
          success: true,
          repostUri: response.uri,
          repostCid: response.cid,
          originalPost: {
            uri: ref.uri,
            cid: post.cid,
            url: blueskyRefs.postWebUrl({ uri: post.uri, handle: post.author.handle }),
            author: post.author.handle,
            text: text ? text.substring(0, 100) + (text.length > 100 ? '...' : '') : 'No text available',
            createdAt: typeof createdAt === 'string' ? createdAt : post.indexedAt,
          },
          selectionMethod: selectionMethod,
          repostedAt: new Date().toISOString(),
        };
      },
    });
  },
});
