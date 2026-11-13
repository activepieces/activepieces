import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsAiProps } from '../../common/ai-props';
import { gravityFormsClient } from '../../common/client';
import type { GravityFormsFeed } from '../../common/types';
import { gravityformsCreateFeedOutputSchema } from '../../output-schemas';

export const createFeedAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_create_feed',
  outputSchema: gravityformsCreateFeedOutputSchema,
  displayName: 'Create Feed',
  description: 'Creates an add-on feed on a form.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates an add-on feed that runs on a form\'s submissions. Meta holds the add-on\'s own settings and differs per add-on; copy its shape from Get Feed on an existing feed of the same add-on. The add-on must be installed. Form ids come from List Forms.',
    idempotent: false,
  },
  props: {
    formId: gravityFormsAiProps.formId({ required: true }),
    addonSlug: Property.ShortText({
      displayName: 'Add-on Slug',
      description: 'The add-on that owns the feed, e.g. "gravityformsmailchimp" or "gravityformswebhooks".',
      required: true,
    }),
    meta: Property.Json({
      displayName: 'Meta',
      description: 'The add-on\'s feed settings, e.g. {"feedName":"Send to CRM","requestURL":"https://example.com/hook"} for Webhooks.',
      required: true,
    }),
  },
  async run(context) {
    const { formId, addonSlug, meta } = context.propsValue;
    return await gravityFormsClient.request<GravityFormsFeed>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/feeds',
      body: { form_id: formId, addon_slug: addonSlug, meta },
    });
  },
});
