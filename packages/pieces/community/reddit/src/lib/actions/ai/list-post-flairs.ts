import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditListPostFlairsOutputSchema } from '../../output-schemas';

export const redditListPostFlairs = createAction({
  auth: redditAuth,
  name: 'reddit_list_post_flairs',
  outputSchema: redditListPostFlairsOutputSchema,
  displayName: 'List Post Flairs',
  description: 'Lists the post flair templates available in a subreddit.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists a subreddit\'s post flair templates. Each `id` is the Flair ID for Create Post, Crosspost and Set Post Flair; `text_editable` tells whether custom text is allowed and `mod_only` whether only moderators can use it. Fails with 403 when the subreddit does not let users pick flair.',
    idempotent: true,
  },
  props: {
    subreddit: redditAiProps.subreddit({ required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await redditApi.request<Record<string, unknown>[]>({
      auth,
      method: HttpMethod.GET,
      path: `/r/${redditApi.cleanSubreddit({ value: propsValue.subreddit })}/api/link_flair_v2`,
    });
    const flairs = response.map((flair) => Object.fromEntries(FLAIR_FIELDS.map((key) => [key, flair[key] ?? null])));
    return { flairs, count: flairs.length };
  },
});

const FLAIR_FIELDS = ['id', 'text', 'text_editable', 'type', 'mod_only', 'allowable_content', 'max_emojis', 'background_color', 'text_color', 'css_class'] as const;
