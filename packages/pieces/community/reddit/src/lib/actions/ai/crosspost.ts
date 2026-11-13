import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditCreatePostOutputSchema } from '../../output-schemas';

export const redditCrosspost = createAction({
  auth: redditAuth,
  name: 'reddit_crosspost',
  outputSchema: redditCreatePostOutputSchema,
  displayName: 'Crosspost',
  description: 'Shares an existing post into another subreddit as a crosspost.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Crossposts an existing post into another subreddit under a new title, linking back to the original. The target subreddit must allow crossposts. Post ID comes from List Posts or Search Posts. Not idempotent: every call creates a new post.',
    idempotent: false,
  },
  props: {
    post_id: Property.ShortText({ displayName: 'Original Post ID', description: 'Post to crosspost, e.g. "abc123" or "t3_abc123".', required: true }),
    subreddit: redditAiProps.subreddit({ required: true, description: 'Target subreddit without r/.' }),
    title: Property.ShortText({ displayName: 'Title', description: 'Title for the crosspost (max 300 characters).', required: true }),
    flair_id: Property.ShortText({ displayName: 'Flair ID', description: 'Flair template id from List Post Flairs for the target subreddit.', required: false }),
    nsfw: redditAiProps.optionalBoolean({ displayName: 'NSFW', description: 'Mark the crosspost as not safe for work.' }),
    spoiler: redditAiProps.optionalBoolean({ displayName: 'Spoiler', description: 'Mark the crosspost as a spoiler.' }),
  },
  async run({ auth, propsValue }) {
    const response = await redditApi.request<SubmitResponse>({
      auth,
      method: HttpMethod.POST,
      path: '/api/submit',
      form: {
        api_type: 'json',
        kind: 'crosspost',
        sr: redditApi.cleanSubreddit({ value: propsValue.subreddit }),
        title: propsValue.title,
        crosspost_fullname: redditApi.toFullname({ value: propsValue.post_id, prefix: 't3_' }),
        flair_id: propsValue.flair_id,
        nsfw: propsValue.nsfw,
        spoiler: propsValue.spoiler,
      },
    });
    const data = response.json.data;
    return { id: data?.id ?? null, name: data?.name ?? null, url: data?.url ?? null };
  },
});

type SubmitResponse = {
  json: { data?: { id?: string; name?: string; url?: string } };
};
