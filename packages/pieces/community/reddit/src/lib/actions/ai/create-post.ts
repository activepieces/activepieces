import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditCreatePostOutputSchema } from '../../output-schemas';

export const redditCreatePost = createAction({
  auth: redditAuth,
  name: 'reddit_create_post',
  outputSchema: redditCreatePostOutputSchema,
  displayName: 'Create Post',
  description: 'Publishes a text or link post to a subreddit.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Publishes a new post to a subreddit: a text post when Text is given, a link post when URL is given (not both). Publishes immediately and publicly. Check Get Post Requirements first for required flair or title rules; Flair ID comes from List Post Flairs. Not idempotent: every call creates a new post.',
    idempotent: false,
  },
  props: {
    subreddit: redditAiProps.subreddit({ required: true }),
    title: Property.ShortText({ displayName: 'Title', description: 'Post title (max 300 characters).', required: true }),
    text: Property.LongText({ displayName: 'Text', description: 'Markdown body for a text post. Leave empty for a link post.', required: false }),
    url: Property.ShortText({ displayName: 'URL', description: 'Link for a link post. Leave empty for a text post.', required: false }),
    flair_id: Property.ShortText({ displayName: 'Flair ID', description: 'Flair template id from List Post Flairs.', required: false }),
    flair_text: Property.ShortText({ displayName: 'Flair Text', description: 'Custom flair text, when the flair template allows editing.', required: false }),
    nsfw: redditAiProps.optionalBoolean({ displayName: 'NSFW', description: 'Mark the post as not safe for work.' }),
    spoiler: redditAiProps.optionalBoolean({ displayName: 'Spoiler', description: 'Mark the post as a spoiler.' }),
    send_replies: redditAiProps.optionalBoolean({ displayName: 'Send Replies to Inbox', description: 'Receive inbox notifications for replies (Reddit default: yes).' }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.text && propsValue.url) {
      throw new Error('Provide either Text (text post) or URL (link post), not both.');
    }
    const response = await redditApi.request<SubmitResponse>({
      auth,
      method: HttpMethod.POST,
      path: '/api/submit',
      form: {
        api_type: 'json',
        sr: redditApi.cleanSubreddit({ value: propsValue.subreddit }),
        title: propsValue.title,
        kind: propsValue.url ? 'link' : 'self',
        text: propsValue.text,
        url: propsValue.url,
        flair_id: propsValue.flair_id,
        flair_text: propsValue.flair_text,
        nsfw: propsValue.nsfw,
        spoiler: propsValue.spoiler,
        sendreplies: propsValue.send_replies,
      },
    });
    const data = response.json.data;
    return { id: data?.id ?? null, name: data?.name ?? null, url: data?.url ?? null };
  },
});

type SubmitResponse = {
  json: { data?: { id?: string; name?: string; url?: string } };
};
