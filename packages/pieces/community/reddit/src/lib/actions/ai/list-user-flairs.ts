import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditListUserFlairsOutputSchema } from '../../output-schemas';

export const redditListUserFlairs = createAction({
  auth: redditAuth,
  name: 'reddit_list_user_flairs',
  outputSchema: redditListUserFlairsOutputSchema,
  displayName: 'List User Flairs',
  description: 'Lists the user flair templates available in a subreddit.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists a subreddit\'s user flair templates (the badge shown next to usernames there), with id, text, whether the text is editable and whether it is moderator-only. Fails with 403 when the subreddit does not let users pick flair.',
    idempotent: true,
  },
  props: {
    subreddit: redditAiProps.subreddit({ required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await redditApi.request<Record<string, unknown>[]>({
      auth,
      method: HttpMethod.GET,
      path: `/r/${redditApi.cleanSubreddit({ value: propsValue.subreddit })}/api/user_flair_v2`,
    });
    const flairs = response.map((flair) => Object.fromEntries(FLAIR_FIELDS.map((key) => [key, flair[key] ?? null])));
    return { flairs, count: flairs.length };
  },
});

const FLAIR_FIELDS = ['id', 'text', 'text_editable', 'type', 'mod_only', 'allowable_content', 'max_emojis', 'background_color', 'text_color', 'css_class'] as const;
