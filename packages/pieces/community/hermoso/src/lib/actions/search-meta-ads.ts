import { createAction, Property } from '@activepieces/pieces-framework';
import { hermosoAuth } from '../auth';
import { hermosoApi } from '../common/client';
import { hermosoProps } from '../common/props';

export const searchMetaAdsAction = createAction({
  auth: hermosoAuth,
  name: 'search_meta_ads',
  classification: 'SEARCH',
  displayName: 'Search Meta Ads',
  description: 'Finds ads running on Facebook and Instagram, by keyword or by advertiser.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches the Meta (Facebook and Instagram) Ad Library by keyword, or lists one advertiser\'s ads by brand name, and returns one row per ad with its copy, call to action, link, run dates and media URL. Use Research Ads for an open question across several brands that needs a written answer. A retry of the same step in the same flow run returns the first answer.',
    idempotent: true,
  },
  props: {
    brand: hermosoProps.brand,
    search_by: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'Search every advertiser by keyword, or list the ads of one advertiser.',
      required: true,
      defaultValue: 'keyword',
      options: {
        options: [
          { label: 'Keyword', value: 'keyword' },
          { label: 'Advertiser', value: 'advertiser' },
        ],
      },
    }),
    query: Property.ShortText({
      displayName: 'Keyword or Advertiser',
      description: 'A keyword such as "prebiotic soda", or an advertiser name such as "Olipop".',
      required: true,
    }),
    domain: Property.ShortText({
      displayName: 'Advertiser Website',
      description: 'Optional, for Advertiser only. The brand website, such as drinkolipop.com, to find the right Facebook page.',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'A two-letter country code such as US, or leave empty for all countries.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'All ads include past ones that ran a long time, which are often the proven winners.',
      required: false,
      defaultValue: 'ALL',
      options: {
        options: [
          { label: 'All ads', value: 'ALL' },
          { label: 'Running now', value: 'ACTIVE' },
          { label: 'Stopped', value: 'INACTIVE' },
        ],
      },
    }),
    media_type: Property.StaticDropdown({
      displayName: 'Media Type',
      required: false,
      defaultValue: 'ALL',
      options: {
        options: [
          { label: 'All', value: 'ALL' },
          { label: 'Images', value: 'IMAGE' },
          { label: 'Videos', value: 'VIDEO' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'How many ads to return, from 1 to 25.',
      required: false,
      defaultValue: 8,
    }),
  },
  async run(context) {
    const query = context.propsValue.query.trim();
    const byAdvertiser = context.propsValue.search_by === 'advertiser';
    const args = {
      query: byAdvertiser ? undefined : query,
      companyName: byAdvertiser ? query : undefined,
      domain: byAdvertiser ? context.propsValue.domain?.trim() : undefined,
      country: context.propsValue.country?.trim().toUpperCase(),
      status: context.propsValue.status,
      mediaType: context.propsValue.media_type,
      limit: clampLimit(context.propsValue.limit),
    };
    const { data } = await hermosoApi.callTool({
      apiKey: context.auth.secret_text,
      brand: context.propsValue.brand ?? undefined,
      name: 'search_meta_ads',
      args,
      idempotencyKey: hermosoApi.idempotencyKey({
        runId: context.run.id,
        stepName: context.step.name,
        operation: 'search_meta_ads',
        payload: args,
      }),
    });
    const ads = Array.isArray(data['ads']) ? data['ads'].filter(hermosoApi.isRecord) : [];
    return ads.map((ad) => ({
      advertiser: hermosoApi.text(ad['page_name']),
      body: hermosoApi.text(ad['body']),
      call_to_action: hermosoApi.text(ad['cta']) || null,
      link: hermosoApi.text(ad['link']) || null,
      dates: hermosoApi.text(ad['dates']) || null,
      media_url: hermosoApi.text(ad['media']) || null,
      thumbnail_url: hermosoApi.text(ad['thumb']) || null,
      from_other_advertiser: ad['from_other_advertiser'] === true,
    }));
  },
});

function clampLimit(value: number | undefined): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return 8;
  }
  return Math.min(25, Math.max(1, Math.floor(value)));
}
