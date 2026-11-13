import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';
import { foreplayProps } from '../../common/props';

const getBrandAnalytics = createAction({
  auth: foreplayCoAuth,
  name: 'get_brand_analytics',
  classification: 'READ',
  displayName: 'Get Brand Analytics',
  description: 'Daily active/inactive ad counts and formats for a brand Facebook page.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one row per day with the number of active and inactive ads and the ads per display format for a brand, i.e. its creative velocity. Pass the numeric Facebook page ID (the pageId field from search_brands; a Foreplay brand ID is rejected by the API), plus an optional date range (YYYY-MM-DD). Costs 1 credit per call.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.analytics,
  props: {
    id: Property.ShortText({ displayName: 'Page ID', description: 'Numeric Facebook page ID, e.g. 373652569755921 (the pageId field of a brand).', required: true }),
    startDate: Property.ShortText({ displayName: 'Start Date', description: 'YYYY-MM-DD, inclusive.', required: false }),
    endDate: Property.ShortText({ displayName: 'End Date', description: 'YYYY-MM-DD, inclusive.', required: false }),
  },
  async run({ auth, propsValue }) {
    const startDate = foreplayProps.dayOnly({ value: propsValue.startDate, label: 'Start Date' });
    const endDate = foreplayProps.dayOnly({ value: propsValue.endDate, label: 'End Date' });
    if (startDate !== undefined && endDate !== undefined && startDate > endDate) throw new Error('Start Date must be on or before End Date.');
    const response = await foreplayClient.request({
      auth,
      path: '/api/brand/analytics',
      query: { id: foreplayProps.pageId({ value: propsValue.id, label: 'Page ID' }), start_date: startDate, end_date: endDate },
    });
    const items = foreplayMappers.listOf(response.body).map(foreplayMappers.analyticsRow);
    return { items, count: items.length, ...foreplayMappers.credits(response) };
  },
});

export { getBrandAnalytics };
