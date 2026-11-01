import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditListSubredditModeratorsOutputSchema } from '../../output-schemas';

export const redditListSubredditModerators = createAction({
  auth: redditAuth,
  name: 'reddit_list_subreddit_moderators',
  outputSchema: redditListSubredditModeratorsOutputSchema,
  displayName: 'List Subreddit Moderators',
  description: 'Lists a subreddit\'s moderators.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the moderators of a subreddit with their permissions and the date they were added. To contact them, use Send Private Message with To set to "/r/<subreddit>".',
    idempotent: true,
  },
  props: {
    subreddit: redditAiProps.subreddit({ required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await redditApi.request<ModeratorsResponse>({
      auth,
      method: HttpMethod.GET,
      path: `/r/${redditApi.cleanSubreddit({ value: propsValue.subreddit })}/about/moderators`,
    });
    const moderators = (response.data?.children ?? []).map((moderator) => ({
      name: moderator.name ?? null,
      id: moderator.id ?? null,
      mod_permissions: moderator.mod_permissions ?? [],
      date: moderator.date ?? null,
    }));
    return { moderators, count: moderators.length };
  },
});

type ModeratorsResponse = {
  data?: {
    children?: { name?: string; id?: string; mod_permissions?: string[]; date?: number }[];
  };
};
