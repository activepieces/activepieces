import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsAiProps } from '../../common/ai-props';
import { gravityFormsClient } from '../../common/client';
import type { GravityFormsFeed } from '../../common/types';
import { gravityformsGetFeedOutputSchema } from '../../output-schemas';

export const getFeedAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_get_feed',
  outputSchema: gravityformsGetFeedOutputSchema,
  displayName: 'Get Feed',
  description: 'Gets one add-on feed with its settings.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Gets one add-on feed by id with its form_id, addon_slug, is_active and meta settings. Feed ids come from List Feeds.',
    idempotent: true,
  },
  props: {
    feedId: gravityFormsAiProps.feedId({ required: true }),
  },
  async run(context) {
    return await gravityFormsClient.request<GravityFormsFeed>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/feeds/${encodeURIComponent(context.propsValue.feedId)}`,
    });
  },
});
