import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { redditAuth } from '../auth';
import { redditApi, RedditListing, RedditThing } from '../common/client';
import { fetchPostCommentsOutputSchema } from '../output-schemas';

export const fetchPostComments = createAction({
  auth: redditAuth,
  name: 'fetchPostComments',
  outputSchema: fetchPostCommentsOutputSchema,
  classification: 'SEARCH',
  displayName: 'Fetch Post Comments',
  description: 'Fetch comments from a specific Reddit post.',
  audience: 'human',
  aiMetadata: { description: 'Retrieves the threaded comments of one Reddit post identified by its ID, including nested replies. Use it to read discussion on a known post; the sort option (new, top, hot, best, old, controversial) and a limit on top-level comments are configurable. Accepts the post ID with or without the t3_ prefix. Read-only and idempotent.', idempotent: true },
  props: {
    post_id: Property.ShortText({
      displayName: 'Post ID',
      description: 'The ID of the Reddit post (e.g. "abc123" or "t3_abc123").',
      required: true,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Sorting method for comments',
      defaultValue: 'new',
      required: false,
      options: {
        options: [
          { label: 'New', value: 'new' },
          { label: 'Top', value: 'top' },
          { label: 'Hot', value: 'hot' },
          { label: 'Best', value: 'best' },
          { label: 'Old', value: 'old' },
          { label: 'Controversial', value: 'controversial' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of top-level comments to fetch',
      defaultValue: 10,
      required: false,
    }),
  },
  async run(context) {
    const listings = await redditApi.request<[RedditListing, RedditListing]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/comments/${redditApi.toBaseId({ value: context.propsValue.post_id })}`,
      query: {
        sort: context.propsValue.sort ?? 'new',
        limit: context.propsValue.limit ?? 10,
      },
    });

    return processComments({ comments: listings[1]?.data?.children ?? [] });
  },
});

function processComments({ comments }: { comments: RedditThing[] }): ProcessedComment[] {
  return comments
    .filter((comment) => comment.kind === 't1')
    .map((comment) => {
      const d = comment.data;
      const replies = d['replies'];
      return {
        id: d['id'],
        author: d['author'],
        body: d['body'],
        score: d['score'],
        created_utc: d['created_utc'],
        permalink: d['permalink'],
        edited: d['edited'],
        is_submitter: d['is_submitter'],
        stickied: d['stickied'],
        replies: isReplyListing(replies) ? processComments({ comments: replies.data.children }) : [],
      };
    });
}

function isReplyListing(value: unknown): value is RedditListing {
  return typeof value === 'object' && value !== null && 'data' in value && typeof value.data === 'object' && value.data !== null && 'children' in value.data && Array.isArray(value.data.children);
}

type ProcessedComment = {
  id: unknown;
  author: unknown;
  body: unknown;
  score: unknown;
  created_utc: unknown;
  permalink: unknown;
  edited: unknown;
  is_submitter: unknown;
  stickied: unknown;
  replies: ProcessedComment[];
};
