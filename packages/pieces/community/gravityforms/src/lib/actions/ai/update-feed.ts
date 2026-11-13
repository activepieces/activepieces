import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsAiProps } from '../../common/ai-props';
import { gravityFormsClient } from '../../common/client';
import type { GravityFormsFeed } from '../../common/types';
import { gravityformsGetFeedOutputSchema } from '../../output-schemas';

export const updateFeedAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_update_feed',
  outputSchema: gravityformsGetFeedOutputSchema,
  displayName: 'Update Feed',
  description: 'Changes some of an add-on feed\'s settings, or turns it on or off.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates an add-on feed by id, changing only what you set: Meta keys you send replace those keys and other meta is kept; Active turns the feed on or off. Feed ids come from List Feeds.',
    idempotent: true,
  },
  props: {
    feedId: gravityFormsAiProps.feedId({ required: true }),
    meta: Property.Json({
      displayName: 'Meta',
      description: 'Feed settings to change, e.g. {"feedName":"Send to CRM v2"}. Keys not sent keep their value. Defaults to none.',
      required: false,
    }),
    isActive: Property.StaticDropdown({
      displayName: 'Active',
      description: '"true" turns the feed on, "false" turns it off. Defaults to unchanged.',
      required: false,
      options: {
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
    feedOrder: Property.Number({
      displayName: 'Order',
      description: 'Position of the feed among the form\'s feeds of the same add-on, starting at 0. Defaults to unchanged.',
      required: false,
    }),
  },
  async run(context) {
    const { feedId, meta, isActive, feedOrder } = context.propsValue;
    return await gravityFormsClient.request<GravityFormsFeed>({
      auth: context.auth,
      method: HttpMethod.PATCH,
      path: `/feeds/${encodeURIComponent(feedId)}`,
      body: {
        ...(meta !== undefined && Object.keys(meta).length > 0 ? { meta } : {}),
        ...(isActive !== undefined ? { is_active: isActive === 'true' } : {}),
        ...(feedOrder !== undefined ? { feed_order: feedOrder } : {}),
      },
    });
  },
});
