import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi, RedditThing } from '../../common/client';
import { redditAiProps } from '../../common/ai-props';
import { redditGetUserTrophiesOutputSchema } from '../../output-schemas';

export const redditGetUserTrophies = createAction({
  auth: redditAuth,
  name: 'reddit_get_user_trophies',
  outputSchema: redditGetUserTrophiesOutputSchema,
  displayName: 'Get User Trophies',
  description: 'Lists the trophies shown on a user\'s profile.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Lists a user\'s profile trophies (e.g. account-age milestones, Verified Email), with name, description and grant time. Works for your own username too.',
    idempotent: true,
  },
  props: {
    username: redditAiProps.username({}),
  },
  async run({ auth, propsValue }) {
    const response = await redditApi.request<{ data?: { trophies?: RedditThing[] } }>({
      auth,
      method: HttpMethod.GET,
      path: `/api/v1/user/${redditApi.cleanUsername({ value: propsValue.username })}/trophies`,
    });
    const trophies = (response.data?.trophies ?? []).map((trophy) =>
      Object.fromEntries(TROPHY_FIELDS.map((key) => [key, trophy.data[key] ?? null])),
    );
    return { trophies, count: trophies.length };
  },
});

const TROPHY_FIELDS = ['id', 'name', 'description', 'award_id', 'granted_at', 'url', 'icon_70'] as const;
