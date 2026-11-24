import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../auth';
import { foreplayClient } from '../common/client';
import { foreplayMappers } from '../common/mappers';
import { foreplayOutputSchemas } from '../common/output-schemas';
import { foreplayProps } from '../common/props';

const findAds = createAction({
  auth: foreplayCoAuth,
  name: 'findAds',
  classification: 'SEARCH',
  displayName: 'Find Ads',
  description: 'Search and filter ads by text, dates, platforms, and categories. Costs 1 Foreplay credit per ad returned.',
  audience: 'human',
  aiMetadata: {
    description: 'Search the Foreplay ad library across all advertisers by free text and filters (dates, platform, format, niche, market, language, live status) with cursor pagination. Returns raw Foreplay ad objects. Costs 1 credit per ad returned.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.rawAds,
  props: {
    query: Property.ShortText({ displayName: 'Search Query', description: 'Words in the ad name or copy. Leave empty to use filters only.', required: false }),
    ...foreplayProps.humanAdFilterProps(),
    order: foreplayProps.sortOrderProp(),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'Cursor from the previous response, for the next page.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Ads per request (1 to 250). 1 credit per ad returned.', required: false, defaultValue: 10 }),
  },
  async run({ auth, propsValue }) {
    const response = await foreplayClient.request({
      auth,
      path: '/api/discovery/ads',
      query: {
        query: foreplayProps.optionalText(propsValue.query),
        ...foreplayProps.adFilterQuery(foreplayProps.humanAdFilterInput(propsValue)),
        order: foreplayProps.enumValue({ value: propsValue.order, label: 'Order', allowed: foreplayProps.SORT_ORDERS }),
        cursor: foreplayProps.optionalText(propsValue.cursor),
        limit: foreplayProps.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 250 }),
      },
    });
    return foreplayMappers.listOf(response.body);
  },
});

export { findAds };
