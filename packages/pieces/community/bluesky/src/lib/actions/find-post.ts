import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { createBlueskyAgent } from '../common/client';
import { postUrlProperty, extractPostInfoFromUrl } from '../common/props';

export const findPost = createAction({
  auth: blueskyAuth,
  name: 'findPost',
  displayName: 'Find Post',
  description: 'Get detailed information about a specific post',
  props: {
    postUrl: postUrlProperty,
  },
  async run({ auth, propsValue }) {
    const { postUrl } = propsValue;

    try {
      const agent = await createBlueskyAgent(auth);
      
      const postInfo = extractPostInfoFromUrl(postUrl);
      let atUri = postInfo.uri;

      if (!atUri && postInfo.handle && postInfo.postId) {
        const didDoc = await agent.resolveHandle({ handle: postInfo.handle });
        
        if (didDoc.data?.did) {
          atUri = `at://${didDoc.data.did}/app.bsky.feed.post/${postInfo.postId}`;
        } else {
          throw new Error(`Could not resolve handle: ${postInfo.handle}`);
        }
      }

      if (!atUri) {
        throw new Error('Could not parse the post URL. Please make sure you are using a valid Bluesky post URL like: https://bsky.app/profile/username.bsky.social/post/xxx');
      }

      if (!atUri.startsWith('at://')) {
        throw new Error('Invalid URI format. Must be an AT-URI starting with "at://" or a valid Bluesky URL');
      }

      const response = await agent.getPosts({ uris: [atUri] });

      if (!response.data?.posts || response.data.posts.length === 0) {
        throw new Error('Post not found or not accessible');
      }

      const post = response.data.posts[0];
      
      return {
        success: true,
        uri: atUri,
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find post: ${errorMessage}`);
    }
  },
});