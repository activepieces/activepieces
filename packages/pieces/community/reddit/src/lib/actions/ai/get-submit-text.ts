import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditGetSubmitTextOutputSchema } from '../../output-schemas';

export const redditGetSubmitText = createAction({
  auth: redditAuth,
  name: 'reddit_get_submit_text',
  outputSchema: redditGetSubmitTextOutputSchema,
  displayName: 'Get Submission Guidelines',
  description: 'Gets the guideline text a subreddit shows on its submit page.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the free-text submission guidelines moderators show on a subreddit\'s submit page (often empty). Complements Get Subreddit Rules and Get Post Requirements, which hold the structured rules.',
    idempotent: true,
  },
  props: {
    subreddit: redditAiProps.subreddit({ required: true }),
  },
  async run({ auth, propsValue }) {
    const subreddit = redditApi.cleanSubreddit({ value: propsValue.subreddit });
    const response = await redditApi.request<{ submit_text?: string; submit_text_html?: string | null }>({
      auth,
      method: HttpMethod.GET,
      path: `/r/${subreddit}/api/submit_text`,
    });
    return { subreddit, submit_text: response.submit_text ?? '', submit_text_html: response.submit_text_html ?? null };
  },
});
