import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tokportalAuth } from '../auth';
import { tokportalApiCall } from '../common/client';
import { tokportalProps } from '../common/props';

export const createBundle = createAction({
  auth: tokportalAuth,
  name: 'create_bundle',
  displayName: 'Create Bundle',
  description:
    'Creates and pays a bundle (mission): a new managed account, an account with video slots, or video slots on an existing delivered account. Credits are debited immediately.',
  audience: 'both',
  aiMetadata: {
    description:
      'Create a TokPortal bundle (mission) that provisions a new managed TikTok/Instagram account and/or video slots. Credits are debited immediately, so check Get Credit Costs first. Configure the account or videos afterwards, then call Publish Bundle. Each call creates a new bundle unless external_ref matches an existing new-account bundle.',
    idempotent: false,
  },
  props: {
    bundleType: tokportalProps.bundleType(true),
    platform: tokportalProps.platform(false),
    country: tokportalProps.country(false),
    accountId: tokportalProps.accountId(false),
    videosQuantity: Property.Number({
      displayName: 'Videos Quantity',
      description: 'Number of video slots to purchase on this bundle.',
      required: false,
    }),
    editsQuantity: Property.Number({
      displayName: 'Edits Quantity',
      description: 'Number of video edit slots to purchase.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Internal title of the bundle.',
      required: false,
    }),
    externalRef: Property.ShortText({
      displayName: 'External Reference',
      description:
        'Your own correlation reference (for example a CRM row ID). Reusing it on a new-account bundle can return the existing bundle instead of creating a new one.',
      required: false,
    }),
    autoFinalizeVideos: Property.Checkbox({
      displayName: 'Auto Finalize Videos',
      description: 'Finalize posted videos automatically without a manual review (default true).',
      required: false,
    }),
    wantsAdvancedWarming: Property.Checkbox({
      displayName: 'Advanced Niche Warming',
      description:
        'Purchase Advanced Niche Warming (search-term based warming with recorded proof). Provide either Advanced Warming Terms or Advanced Warming Terms Count.',
      required: false,
    }),
    advancedWarmingTerms: Property.Array({
      displayName: 'Advanced Warming Terms',
      description: '3-30 niche search terms (count must be a multiple of 3), for example "healthy meal prep".',
      required: false,
    }),
    advancedWarmingTermsCount: Property.Number({
      displayName: 'Advanced Warming Terms Count',
      description: 'Number of niche targets to purchase now and configure later (3-30, multiple of 3).',
      required: false,
    }),
    nicheWarmingInstructions: Property.LongText({
      displayName: 'Niche Warming Instructions',
      description: 'Free-text instructions for the account manager about the niche to warm the account in.',
      required: false,
    }),
  },
  async run(context) {
    const {
      bundleType,
      platform,
      country,
      accountId,
      videosQuantity,
      editsQuantity,
      title,
      externalRef,
      autoFinalizeVideos,
      wantsAdvancedWarming,
      advancedWarmingTerms,
      advancedWarmingTermsCount,
      nicheWarmingInstructions,
    } = context.propsValue;

    if (bundleType === 'videos_only' && !accountId) {
      throw new Error('Account is required for videos_only bundles.');
    }
    if (bundleType !== 'videos_only' && !country) {
      throw new Error('Country is required unless Bundle Type is videos_only.');
    }

    return await tokportalApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: '/bundles',
      body: {
        bundle_type: bundleType,
        platform: platform || undefined,
        country: country || undefined,
        account_id: accountId || undefined,
        videos_quantity: videosQuantity ?? undefined,
        edits_quantity: editsQuantity ?? undefined,
        title: title || undefined,
        external_ref: externalRef || undefined,
        auto_finalize_videos: autoFinalizeVideos ?? undefined,
        wants_advanced_warming: wantsAdvancedWarming ?? undefined,
        advanced_warming_terms:
          advancedWarmingTerms && advancedWarmingTerms.length > 0
            ? advancedWarmingTerms.map((term) => String(term))
            : undefined,
        advanced_warming_terms_count: advancedWarmingTermsCount ?? undefined,
        niche_warming_instructions: nicheWarmingInstructions || undefined,
      },
    });
  },
});
