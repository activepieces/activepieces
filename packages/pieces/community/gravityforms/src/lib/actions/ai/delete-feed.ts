import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsAiProps } from '../../common/ai-props';
import { gravityFormsClient } from '../../common/client';
import type { GravityFormsDeleted, GravityFormsFeed } from '../../common/types';
import { gravityformsDeleteFeedOutputSchema } from '../../output-schemas';

export const deleteFeedAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_delete_feed',
  outputSchema: gravityformsDeleteFeedOutputSchema,
  displayName: 'Delete Feed',
  description: 'Permanently deletes an add-on feed.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes an add-on feed; there is no trash. To stop a feed without losing it, use Update Feed with Active "false". Feed ids come from List Feeds.',
    idempotent: false,
  },
  props: {
    feedId: gravityFormsAiProps.feedId({ required: true }),
  },
  async run(context) {
    return await gravityFormsClient.request<GravityFormsDeleted<GravityFormsFeed>>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/feeds/${encodeURIComponent(context.propsValue.feedId)}`,
    });
  },
});
