import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { likePostOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';
import { blueskyMappers } from '../common/mappers';

export const likePost = createAction({
  auth: blueskyAuth,
  name: 'likePost',
  classification: 'WRITE',
  displayName: 'Like Post',
  description: 'Like a post on Bluesky',
  audience: 'human',
  outputSchema: likePostOutputSchema,
  aiMetadata: {
    description:
      'Adds a like from the authenticated account to a specific Bluesky post, identified either by an AT-URI / bsky.app post URL or by selecting from the recent timeline. Use to register approval of a post. Not idempotent: each call creates a separate like record.',
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
      action: 'like the post',
      fn: async (agent) => {
        const ref = await blueskyRefs.resolvePostRef({ agent, input });
        const postsResponse = await agent.getPosts({ uris: [ref.uri] });
        const post = postsResponse.data.posts[0];
        if (!post) {
          throw new Error('Post not found. Please check the URL and try again.');
        }
        const response = await agent.like(ref.uri, post.cid);
        const text = blueskyMappers.recordText(post.record);
        return {
          success: true,
          likeUri: response.uri,
          likeCid: response.cid,
          postUri: ref.uri,
          postCid: post.cid,
          postUrl: blueskyRefs.postWebUrl({ uri: post.uri, handle: post.author.handle }),
          postAuthor: post.author.handle,
          postText: text ? text.substring(0, 100) + (text.length > 100 ? '...' : '') : 'No text available',
          selectionMethod: selectionMethod,
          likedAt: new Date().toISOString(),
        };
      },
    });
  },
});
