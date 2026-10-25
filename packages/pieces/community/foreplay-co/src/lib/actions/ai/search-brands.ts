import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';
import { foreplayProps } from '../../common/props';

const searchBrands = createAction({
  auth: foreplayCoAuth,
  name: 'search_brands',
  classification: 'SEARCH',
  displayName: 'Search Brands',
  description: 'Search Foreplay brands by name.',
  audience: 'ai',
  aiMetadata: {
    description: 'Finds brands in the Foreplay index by name (exact phrase first, then starts-with, then contains, ranked by popularity). Each brand has its Foreplay brand ID (for List Brand Ads), Facebook page ID (pageId, for List Page Ads), websites and ad counts. Brands with no indexed ads are hidden unless includeEmpty is true. Costs 1 credit per call regardless of results.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.brandList,
  props: {
    query: Property.ShortText({ displayName: 'Brand Name', required: true }),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 100, default 10.', required: false }),
    includeEmpty: Property.Checkbox({ displayName: 'Include Brands Without Ads', required: false, defaultValue: false }),
    minAds: Property.Number({ displayName: 'Min Ads', required: false }),
    maxAds: Property.Number({ displayName: 'Max Ads', required: false }),
  },
  async run({ auth, propsValue }) {
    const minAds = foreplayProps.parseInteger({ value: propsValue.minAds, label: 'Min Ads', min: 0, max: Number.MAX_SAFE_INTEGER });
    const maxAds = foreplayProps.parseInteger({ value: propsValue.maxAds, label: 'Max Ads', min: 0, max: Number.MAX_SAFE_INTEGER });
    if (minAds !== undefined && maxAds !== undefined && minAds > maxAds) throw new Error('Min Ads must not be greater than Max Ads.');
    const response = await foreplayClient.request({
      auth,
      path: '/api/discovery/brands',
      query: {
        query: foreplayProps.requiredText({ value: propsValue.query, label: 'Brand Name' }),
        limit: foreplayProps.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 100 }) ?? 10,
        include_empty: propsValue.includeEmpty === true ? true : undefined,
        min_ads: minAds,
        max_ads: maxAds,
      },
    });
    const items = foreplayMappers.listOf(response.body).map(foreplayMappers.brand);
    return { items, count: items.length, ...foreplayMappers.credits(response) };
  },
});

export { searchBrands };
