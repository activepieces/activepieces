import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditGetPostRequirementsOutputSchema } from '../../output-schemas';

export const redditGetPostRequirements = createAction({
  auth: redditAuth,
  name: 'reddit_get_post_requirements',
  outputSchema: redditGetPostRequirementsOutputSchema,
  displayName: 'Get Post Requirements',
  description: 'Gets the validation rules a new post in a subreddit must meet.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the machine-checked requirements for posting in a subreddit: title length and required or banned words, body rules, whether flair is required, banned and allowed domains, and link repost rules. Call before Create Post to avoid rejected submissions.',
    idempotent: true,
  },
  props: {
    subreddit: redditAiProps.subreddit({ required: true }),
  },
  async run({ auth, propsValue }) {
    return redditApi.request<Record<string, unknown>>({
      auth,
      method: HttpMethod.GET,
      path: `/api/v1/${redditApi.cleanSubreddit({ value: propsValue.subreddit })}/post_requirements`,
    });
  },
});
