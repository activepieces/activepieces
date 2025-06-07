import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { redditAuth } from '../../index';

export const fetchPostComments = createAction({
  auth: redditAuth,
  name: 'fetchPostComments',
  displayName: 'Fetch Post Comments',
  description: 'Fetch comments from a specific Reddit post.',
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
    let postId = context.propsValue.post_id.trim();
    if (postId.startsWith('t3_')) {
      postId = postId.slice(3);
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://oauth.reddit.com/comments/${postId}`,
      headers: {
        'Authorization': `Bearer ${context.auth.access_token}`,
        'User-Agent': 'ActivePieces Reddit Client',
        'Content-Type': 'application/json',
      },
      queryParams: {
        sort: context.propsValue.sort ?? 'new',
        limit: (context.propsValue.limit ?? 10).toString(),
      },
    });

    if (response.status !== 200) {
      return {
        error: `Failed to retrieve comments: ${response.status}`,
        details: response.body,
      };
    }

    function processComments(comments: any[]): any[] {
      return comments
        .filter(c => c.kind === 't1')
        .map(c => {
          const d = c.data;
          return {
            id: d.id,
            author: d.author,
            body: d.body,
            score: d.score,
            created_utc: d.created_utc,
            permalink: d.permalink,
            edited: d.edited,
            is_submitter: d.is_submitter,
            stickied: d.stickied,
            replies: d.replies && typeof d.replies === 'object'
              ? processComments(d.replies.data.children)
              : [],
          };
        });
    }

    const data = response.body;
    const commentsTree = data[1]?.data?.children ?? [];

    return processComments(commentsTree);
  },
});
