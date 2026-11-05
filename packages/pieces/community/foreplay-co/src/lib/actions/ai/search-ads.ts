import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';
import { foreplayProps } from '../../common/props';

const searchAds = createAction({
  auth: foreplayCoAuth,
  name: 'search_ads',
  classification: 'SEARCH',
  displayName: 'Search Ads',
  description: 'Search the Foreplay ad library with text and filters.',
  audience: 'ai',
  aiMetadata: {
    description: 'Searches the whole Foreplay ad index (all advertisers) by free text in the ad name or copy, with optional filters: date range, live status, display format, platform, niche, market target, language, video length and running days. Costs 1 Foreplay credit per ad returned, so keep limit small (default 10, max 250). Returns one page; when hasMore is true call again with cursor set to nextCursor. To list ads of one known advertiser use List Page Ads or List Brand Ads instead.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.adCursorPage,
  props: {
    query: Property.ShortText({ displayName: 'Search Text', description: 'Words in the ad name or copy. Empty = filters only.', required: false }),
    ...foreplayProps.aiAdFilterProps(),
    order: foreplayProps.sortOrderProp(),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 250, default 10. 1 credit per ad returned.', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'nextCursor from the previous page.', required: false }),
  },
  async run({ auth, propsValue }) {
    const limit = foreplayProps.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 250 }) ?? 10;
    const response = await foreplayClient.request({
      auth,
      path: '/api/discovery/ads',
      query: {
        query: foreplayProps.optionalText(propsValue.query),
        ...foreplayProps.adFilterQuery(foreplayProps.aiAdFilterInput(propsValue)),
        order: foreplayProps.enumValue({ value: propsValue.order, label: 'Order', allowed: foreplayProps.SORT_ORDERS }),
        cursor: foreplayProps.optionalText(propsValue.cursor),
        limit,
      },
    });
    return foreplayMappers.cursorPage({ response, map: foreplayMappers.ad, limit });
  },
});

export { searchAds };
