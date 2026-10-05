import { createAction } from '@activepieces/pieces-framework';
import type { AppBskyFeedDefs, AppBskyFeedGetPostThread } from '@atproto/api';
import { blueskyAtproto } from '../common/atproto';
import { blueskyAuth } from '../common/auth';
import { findThreadOutputSchema } from '../output-schemas';
import { blueskyClient } from '../common/client';
import { blueskyProps } from '../common/props';
import { blueskyRefs } from '../common/refs';

export const findThread = createAction({
  auth: blueskyAuth,
  name: 'findThread',
  classification: 'READ',
  displayName: 'Find Thread',
  description: 'Get a full conversation thread with replies',
  audience: 'both',
  outputSchema: findThreadOutputSchema,
  aiMetadata: {
    description:
      'Retrieves the full conversation thread around a Bluesky post (parent posts and nested replies) given a bsky.app post URL or AT-URI, with configurable reply depth (default 10) and parent height (default 3), each 0-1000. Use to read an entire discussion rather than a single post. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    postUrl: blueskyProps.postUrlProperty,
    depth: blueskyProps.threadDepthDropdown,
    parentHeight: blueskyProps.parentHeightDropdown,
  },
  async run({ auth, propsValue }) {
    const { postUrl, depth = '10', parentHeight = '3' } = propsValue;
    blueskyRefs.parsePostInput(postUrl);
    const depthNum = parseInt(String(depth), 10);
    const parentHeightNum = parseInt(String(parentHeight), 10);
    if (isNaN(depthNum) || depthNum < 0 || depthNum > 1000) {
      throw new Error('Depth must be a number between 0 and 1000');
    }
    if (isNaN(parentHeightNum) || parentHeightNum < 0 || parentHeightNum > 1000) {
      throw new Error('Parent height must be a number between 0 and 1000');
    }
    return blueskyClient.withBluesky({
      auth: auth.props,
      action: 'find the thread',
      fn: async (agent) => {
        const ref = await blueskyRefs.resolvePostRef({ agent, input: postUrl });
        const response = await agent.getPostThread({ uri: ref.uri, depth: depthNum, parentHeight: parentHeightNum });
        return {
          success: true,
          thread: response.data.thread,
          requestedUri: ref.uri,
          parameters: { depth: depthNum, parentHeight: parentHeightNum },
          statistics: threadStatistics(response.data.thread),
          retrievedAt: new Date().toISOString(),
        };
      },
    });
  },
});

function threadStatistics(thread: ThreadRoot): ThreadStatistics {
  const empty: ThreadStatistics = { totalPosts: 0, parentPosts: 0, replyPosts: 0, notFoundPosts: 0, blockedPosts: 0 };
  if (!blueskyAtproto.isThreadViewPost(thread)) {
    return {
      ...empty,
      notFoundPosts: blueskyAtproto.isNotFoundPost(thread) ? 1 : 0,
      blockedPosts: blueskyAtproto.isBlockedPost(thread) ? 1 : 0,
    };
  }
  const parents = countParents(thread.parent);
  const replies = countReplies(thread.replies ?? []);
  return {
    totalPosts: 1 + parents.posts + replies.posts,
    parentPosts: parents.posts,
    replyPosts: replies.posts,
    notFoundPosts: parents.notFound + replies.notFound,
    blockedPosts: parents.blocked + replies.blocked,
  };
}

function countParents(node: AppBskyFeedDefs.ThreadViewPost['parent']): NodeCounts {
  if (blueskyAtproto.isThreadViewPost(node)) {
    const above = countParents(node.parent);
    return { ...above, posts: above.posts + 1 };
  }
  return {
    posts: 0,
    notFound: blueskyAtproto.isNotFoundPost(node) ? 1 : 0,
    blocked: blueskyAtproto.isBlockedPost(node) ? 1 : 0,
  };
}

function countReplies(nodes: NonNullable<AppBskyFeedDefs.ThreadViewPost['replies']>): NodeCounts {
  return nodes.reduce<NodeCounts>(
    (total, node) => {
      if (blueskyAtproto.isThreadViewPost(node)) {
        const nested = countReplies(node.replies ?? []);
        return {
          posts: total.posts + 1 + nested.posts,
          notFound: total.notFound + nested.notFound,
          blocked: total.blocked + nested.blocked,
        };
      }
      return {
        posts: total.posts,
        notFound: total.notFound + (blueskyAtproto.isNotFoundPost(node) ? 1 : 0),
        blocked: total.blocked + (blueskyAtproto.isBlockedPost(node) ? 1 : 0),
      };
    },
    { posts: 0, notFound: 0, blocked: 0 },
  );
}

type ThreadRoot = AppBskyFeedGetPostThread.OutputSchema['thread'];
type NodeCounts = { posts: number; notFound: number; blocked: number };
type ThreadStatistics = { totalPosts: number; parentPosts: number; replyPosts: number; notFoundPosts: number; blockedPosts: number };
