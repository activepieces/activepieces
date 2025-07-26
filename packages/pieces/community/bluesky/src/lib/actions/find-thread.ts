import { createAction, Property } from '@activepieces/pieces-framework';
import { blueskyAuth } from '../common/auth';
import { makeBlueskyRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { postUrlProperty, threadDepthDropdown, parentHeightDropdown, extractPostInfoFromUrl } from '../common/props';

export const findThread = createAction({
  auth: blueskyAuth,
  name: 'findThread',
  displayName: 'Find Thread',
  description: 'Retrieve a full thread, including parent posts and replies, up to 100 deep',
  props: {
    postUrl: postUrlProperty,
    depth: threadDepthDropdown,
    parentHeight: parentHeightDropdown,
  },
  async run({ auth, propsValue }) {
    const { postUrl, depth = 6, parentHeight = 80 } = propsValue;

    try {
      // Extract post information from user-friendly URL
      const postInfo = extractPostInfoFromUrl(postUrl);
      let postUri = postInfo.uri;

      // If we don't have an AT-URI but have handle and postId, we need to resolve the handle to DID
      if (!postUri && postInfo.handle && postInfo.postId) {
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
          postUri = `at://${resolveResponse.did}/app.bsky.feed.post/${postInfo.postId}`;
        } else {
          throw new Error(`Could not resolve handle: ${postInfo.handle}`);
        }
      }

      if (!postUri) {
        throw new Error('Could not parse the post URL. Please make sure you are using a valid Bluesky post URL like: https://bsky.app/profile/username.bsky.social/post/xxx');
      }

      // Validate AT-URI format
      if (!postUri.startsWith('at://')) {
        throw new Error('Invalid URI format. Must be an AT-URI starting with "at://" or a valid Bluesky URL');
      }

      // Convert string values to numbers for validation
      const depthNum = parseInt(depth.toString(), 10);
      const parentHeightNum = parseInt(parentHeight.toString(), 10);
      
      // Validate depth and parentHeight parameters
      if (isNaN(depthNum) || depthNum < 0 || depthNum > 1000) {
        throw new Error('Depth must be a number between 0 and 1000');
      }
      if (isNaN(parentHeightNum) || parentHeightNum < 0 || parentHeightNum > 1000) {
        throw new Error('Parent height must be a number between 0 and 1000');
      }

      // Fetch the thread using app.bsky.feed.getPostThread
      // This is a public endpoint that doesn't require authentication
      const response = await makeBlueskyRequest(
        auth,
        HttpMethod.GET,
        'app.bsky.feed.getPostThread',
        undefined,
        {
          uri: postUri,
          depth: depthNum.toString(),
          parentHeight: parentHeightNum.toString(),
        },
        false // This is a public endpoint
      );

      // Count posts in the thread
      const stats = {
        totalPosts: 0,
        parentPosts: 0,
        replyPosts: 0,
        notFoundPosts: 0,
        blockedPosts: 0,
      };

      // Recursive function to count posts
      const countPosts = (threadPost: any): void => {
        if (!threadPost) return;

        if (threadPost.$type === 'app.bsky.feed.defs#notFoundPost') {
          stats.notFoundPosts++;
        } else if (threadPost.$type === 'app.bsky.feed.defs#blockedPost') {
          stats.blockedPosts++;
        } else if (threadPost.post) {
          stats.totalPosts++;
        }

        // Count parent posts
        if (threadPost.parent) {
          stats.parentPosts++;
          countPosts(threadPost.parent);
        }

        // Count reply posts
        if (threadPost.replies && Array.isArray(threadPost.replies)) {
          stats.replyPosts += threadPost.replies.length;
          threadPost.replies.forEach((reply: any) => countPosts(reply));
        }
      };

      if (response.thread) {
        countPosts(response.thread);
        // Don't double count the root post
        if (response.thread.post) {
          stats.totalPosts = 1;
        }
      }

      return {
        success: true,
        thread: response.thread,
        requestedUri: postUri,
        parameters: {
          depth,
          parentHeight,
        },
        statistics: stats,
        retrievedAt: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to find thread: ${errorMessage}`);
    }
  },
});
