import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gravityFormsAuth } from '../../auth';
import { gravityFormsAiProps } from '../../common/ai-props';
import { gravityFormsClient } from '../../common/client';
import type { GravityFormsFeed } from '../../common/types';
import { gravityformsListFeedsOutputSchema } from '../../output-schemas';

export const listFeedsAction = createAction({
  auth: gravityFormsAuth,
  name: 'gravityforms_list_feeds',
  outputSchema: gravityformsListFeedsOutputSchema,
  displayName: 'List Feeds',
  description: 'Lists add-on feeds, optionally for one form or one add-on.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists add-on feeds (e.g. Mailchimp, HubSpot, Webhooks), each with its form_id, addon_slug, is_active and meta settings. Filter by Form ID and/or Add-on Slug. Feed ids from here are used by Get Feed, Update Feed and Delete Feed.',
    idempotent: true,
  },
  props: {
    formId: gravityFormsAiProps.formId({
      required: false,
      description: 'Only return feeds of this form, e.g. "14". Use List Forms to find it. Defaults to all forms.',
    }),
    addonSlug: Property.ShortText({
      displayName: 'Add-on Slug',
      description: 'Only return feeds of this add-on, e.g. "gravityformsmailchimp" or "gravityformswebhooks". Defaults to all add-ons.',
      required: false,
    }),
  },
  async run(context) {
    const { formId, addonSlug } = context.propsValue;
    const feeds = await gravityFormsClient.request<GravityFormsFeed[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: formId ? `/forms/${encodeURIComponent(formId)}/feeds` : '/feeds',
      query: addonSlug ? { addon: addonSlug } : undefined,
    });
    return { feeds, count: feeds.length };
  },
});
