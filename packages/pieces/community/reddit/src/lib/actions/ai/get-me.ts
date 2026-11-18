import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditGetMeOutputSchema } from '../../output-schemas';

export const redditGetMe = createAction({
  auth: redditAuth,
  name: 'reddit_get_me',
  outputSchema: redditGetMeOutputSchema,
  displayName: 'Get My Account',
  description: 'Gets the connected Reddit account: username, karma and inbox status.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the connected account\'s profile: username (`name`), id, karma, account age, verification and unread inbox count. Use it to learn which username the agent acts as, e.g. before List User Content on yourself.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const data = await redditApi.request<Record<string, unknown>>({ auth, method: HttpMethod.GET, path: '/api/v1/me' });
    const { kind, ...profile } = redditApi.toThing({ thing: { kind: 't2', data } });
    return { ...profile, inbox_count: data['inbox_count'] ?? null, has_mail: data['has_mail'] ?? null, over_18: data['over_18'] ?? null };
  },
});
