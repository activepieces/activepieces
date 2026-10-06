import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditSetPostFlairOutputSchema } from '../../output-schemas';

export const redditSetPostFlair = createAction({
  auth: redditAuth,
  name: 'reddit_set_post_flair',
  outputSchema: redditSetPostFlairOutputSchema,
  displayName: 'Set Post Flair',
  description: 'Sets or clears the flair on one of your posts.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the flair on a post you authored (or any post if you moderate the subreddit). Flair Template ID comes from List Post Flairs; Text overrides the label when the template is editable. Leaving both empty clears the flair.',
    idempotent: true,
  },
  props: {
    subreddit: redditAiProps.subreddit({ required: true, description: 'Subreddit the post is in, without r/.' }),
    post_id: Property.ShortText({ displayName: 'Post ID', description: 'Post id, e.g. "abc123" or "t3_abc123".', required: true }),
    flair_template_id: Property.ShortText({ displayName: 'Flair Template ID', description: 'Flair template id from List Post Flairs.', required: false }),
    text: Property.ShortText({ displayName: 'Text', description: 'Flair label (max 64 characters), for editable templates.', required: false }),
  },
  async run({ auth, propsValue }) {
    const link = redditApi.toFullname({ value: propsValue.post_id, prefix: 't3_' });
    await redditApi.request<unknown>({
      auth,
      method: HttpMethod.POST,
      path: `/r/${redditApi.cleanSubreddit({ value: propsValue.subreddit })}/api/selectflair`,
      form: {
        api_type: 'json',
        link,
        flair_template_id: propsValue.flair_template_id,
        text: propsValue.text,
      },
    });
    return {
      success: true,
      post: link,
      flair_template_id: propsValue.flair_template_id ?? null,
      text: propsValue.text ?? null,
    };
  },
});
