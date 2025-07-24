import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { makeBlueskyRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { postUrlProperty, extractPostInfoFromUrl } from '../common/props';

export const findPost = createAction({
  auth: blueskyAuth,
  name: 'findPost',
  displayName: 'Find Post',
  description: 'Retrieve a single post\'s details using its URL/URI',
  props: {
    postUrl: postUrlProperty,
  },
  async run({ auth, propsValue }) {
    const { postUrl } = propsValue;

    try {
      // Extract post information from user-friendly URL
      const postInfo = extractPostInfoFromUrl(postUrl);
      let atUri = postInfo.uri;

      // If we don't have an AT-URI but have handle and postId, we need to resolve the handle to DID
      if (!atUri && postInfo.handle && postInfo.postId) {
        // First, resolve the handle to get the DID
        const resolveResponse = await makeBlueskyRequest(
          auth,
          HttpMethod.GET,
          'com.atproto.identity.resolveHandle',
          undefined,
          {
            handle: postInfo.handle,
          },
          false // This is a public endpoint
        );

        if (resolveResponse.did) {
          // Construct the proper AT-URI
          atUri = `at://${resolveResponse.did}/app.bsky.feed.post/${postInfo.postId}`;
        } else {
          throw new Error(`Could not resolve handle: ${postInfo.handle}`);
        }
      }

      if (!atUri) {
        throw new Error('Could not parse the post URL. Please make sure you are using a valid Bluesky post URL like: https://bsky.app/profile/username.bsky.social/post/xxx');
      }

      // Validate AT-URI format
      if (!atUri.startsWith('at://')) {
        throw new Error('Invalid URI format. Must be an AT-URI starting with "at://" or a valid Bluesky URL');
      }

      // Retrieve the post using app.bsky.feed.getPosts
      // This is a public endpoint that doesn't require authentication
      const response = await makeBlueskyRequest(
        auth,
        HttpMethod.GET,
        'app.bsky.feed.getPosts',
        undefined,
        {
          uris: [atUri], // getPosts expects an array of URIs
        },
        false // This is a public endpoint
      );

      if (!response.posts || response.posts.length === 0) {
        throw new Error('Post not found or not accessible');
      }

      const post = response.posts[0];
      
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
        retrievedAt: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find post: ${errorMessage}`);
    }
  },
});
