import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';
import { foreplayProps } from '../../common/props';

const discoverBrandsByAds = createAction({
  auth: foreplayCoAuth,
  name: 'discover_brands_by_ads',
  classification: 'SEARCH',
  displayName: 'Discover Brands by Ads',
  description: 'Find brands whose ads match filters such as niche, format or platform.',
  audience: 'ai',
  aiMetadata: {
    description: 'Discovers brands by the characteristics of their ads, e.g. brands running live video ads on TikTok in the beauty niche. At least one filter is required (running-day filters are not supported by this endpoint). Costs 1 credit per call regardless of how many brands come back (limit default 10, max 100 here).',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.brandList,
  props: {
    ...foreplayProps.aiAdFilterProps({ withRunningDays: false }),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 100, default 10.', required: false }),
  },
  async run({ auth, propsValue }) {
    const filters = foreplayProps.adFilterQuery({ ...foreplayProps.aiAdFilterInput(propsValue), runningDurationMinDays: undefined, runningDurationMaxDays: undefined });
    if (Object.values(filters).every((v) => v === undefined)) throw new Error('Set at least one filter (date, live status, format, platform, niche, market target, language or video length).');
    const response = await foreplayClient.request({
      auth,
      path: '/api/discovery/brands/explore',
      query: { ...filters, limit: foreplayProps.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 100 }) ?? 10 },
    });
    const items = foreplayMappers.listOf(response.body).map(foreplayMappers.brand);
    return { items, count: items.length, ...foreplayMappers.credits(response) };
  },
});

export { discoverBrandsByAds };
