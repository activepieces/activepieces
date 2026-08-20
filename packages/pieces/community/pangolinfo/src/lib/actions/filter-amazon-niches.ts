import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pangolinfoAuth } from '../auth';
import { pangolinfoClient } from '../common';

const filterAmazonNiches = createAction({
  name: 'filter_amazon_niches',
  displayName: 'Filter Amazon Niches',
  description:
    'Discover Amazon niches using search demand and brand concentration metrics with Pangolinfo.',
  audience: 'both',
  aiMetadata: {
    description:
      'Filters Amazon niches using demand and competition thresholds. Use for product opportunity discovery, market intelligence, category research, and niche validation. Read-only and idempotent.',
    idempotent: true,
  },
  auth: pangolinfoAuth,
  props: {
    marketplaceId: Property.ShortText({
      displayName: 'Marketplace ID',
      description: 'Marketplace code such as US.',
      required: true,
      defaultValue: 'US',
    }),
    minSearchVolume: Property.Number({
      displayName: 'Minimum 90-day Search Volume',
      required: false,
      defaultValue: 10000,
    }),
    maxTop5BrandShare: Property.Number({
      displayName: 'Maximum Top-five Brand Click Share',
      description: 'Value from 0 to 1.',
      required: false,
      defaultValue: 0.4,
    }),
    size: Property.Number({
      displayName: 'Results',
      description: 'Number of niches to return, from 1 to 10.',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { marketplaceId, minSearchVolume, maxTop5BrandShare, size } =
      context.propsValue;
    return pangolinfoClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/api/v1/amzscope/niches/filter',
      body: {
        marketplaceId,
        searchVolumeT90Min: Math.max(0, minSearchVolume ?? 10000),
        top5BrandsClickShareMax: Math.max(
          0,
          Math.min(1, maxTop5BrandShare ?? 0.4),
        ),
        page: 1,
        size: Math.max(1, Math.min(10, size ?? 10)),
      },
    });
  },
});

export { filterAmazonNiches };
