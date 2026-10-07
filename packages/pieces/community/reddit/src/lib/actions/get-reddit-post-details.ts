import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { redditAuth } from '../auth';
import { redditApi, RedditListing } from '../common/client';
import { getRedditPostDetailsOutputSchema } from '../output-schemas';

export const getRedditPostDetails = createAction({
  auth: redditAuth,
  name: 'getRedditPostDetails',
  outputSchema: getRedditPostDetailsOutputSchema,
  classification: 'READ',
  displayName: 'Get Post Details',
  description: 'Fetch detailed information about a specific Reddit post using its ID.',
  audience: 'human',
  aiMetadata: { description: 'Looks up one specific Reddit post by its ID and returns its full metadata (title, author, body, score, counts, flags). Use it when you already have a post ID and need details for that single post, not to browse a subreddit. Accepts the ID with or without the t3_ prefix. Read-only and idempotent.', idempotent: true },
  props: {
    post_id: Property.ShortText({
      displayName: 'Post ID',
      description: 'The ID of the Reddit post (e.g. "t3_abc123" or "abc123")',
      required: true,
    }),
  },
  async run(context) {
    const listing = await redditApi.request<RedditListing>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/api/info',
      query: { id: redditApi.toFullname({ value: context.propsValue.post_id, prefix: 't3_' }) },
    });

    const post = listing.data.children[0];
    if (!post) {
      return { error: 'No post found with the given ID' };
    }

    const data = post.data;
    return {
      ...Object.fromEntries(POST_DETAIL_FIELDS.map((key) => [key, data[key]])),
      ...(data['media'] ? { media: data['media'] } : {}),
      ...(data['gallery_data'] ? { gallery_data: data['gallery_data'] } : {}),
    };
  },
});

const POST_DETAIL_FIELDS = [
  'id', 'title', 'author', 'author_fullname', 'subreddit', 'subreddit_id', 'selftext', 'selftext_html', 'score',
  'upvote_ratio', 'created_utc', 'permalink', 'url', 'domain', 'num_comments', 'is_self', 'is_video',
  'is_original_content', 'over_18', 'spoiler', 'locked', 'stickied', 'post_hint',
] as const;
