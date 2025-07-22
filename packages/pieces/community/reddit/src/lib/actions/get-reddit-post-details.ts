import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { redditAuth } from '../../index';

export const getRedditPostDetails = createAction({
  auth: redditAuth,
  name: 'getRedditPostDetails',
  displayName: 'Get Post Details',
  description: 'Fetch detailed information about a specific Reddit post using its ID.',
  props: {
    post_id: Property.ShortText({
      displayName: 'Post ID',
      description: 'The ID of the Reddit post (e.g. "t3_abc123" or "abc123")',
      required: true,
    }),
  },
  async run(context) {
    let postId = context.propsValue.post_id.trim();
    if (postId.startsWith('t3_')) {
      postId = postId.slice(3);
    }

    const url = `https://oauth.reddit.com/api/info?id=t3_${postId}`;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url,
      headers: {
        'Authorization': `Bearer ${context.auth.access_token}`,
        'User-Agent': 'ActivePieces Reddit Client',
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    if (response.status !== 200) {
      return {
        error: `Failed to retrieve post details: ${response.status}`,
        details: response.body,
      };
    }

    const children = response.body?.data?.children ?? [];

    if (children.length === 0) {
      return { error: 'No post found with the given ID' };
    }

    const data = children[0].data;

    const result: Record<string, unknown> = {
      id: data.id,
      title: data.title,
      author: data.author,
      author_fullname: data.author_fullname,
      subreddit: data.subreddit,
      subreddit_id: data.subreddit_id,
      selftext: data.selftext,
      selftext_html: data.selftext_html,
      score: data.score,
      upvote_ratio: data.upvote_ratio,
      created_utc: data.created_utc,
      permalink: data.permalink,
      url: data.url,
      domain: data.domain,
      num_comments: data.num_comments,
      is_self: data.is_self,
      is_video: data.is_video,
      is_original_content: data.is_original_content,
      over_18: data.over_18,
      spoiler: data.spoiler,
      locked: data.locked,
      stickied: data.stickied,
      post_hint: data.post_hint,
    };

    if (data.media) {
      result['media'] = data.media;
    }

    if (data.gallery_data) {
      result['gallery_data'] = data.gallery_data;
    }

    return result;
  },
});
