import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';
import { foreplayProps } from '../../common/props';

const CATEGORIES = ['all', 'breakout', 'evergreen'];

const listSpyderRankedAds = createAction({
  auth: foreplayCoAuth,
  name: 'list_spyder_ranked_ads',
  classification: 'SEARCH',
  displayName: 'List Spyder Ranked Ads',
  description: 'Ranked ads of a tracked page, filtered to breakout or evergreen.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists the ranked ads of a page on the user\'s Spyder watchlist, one page at a time, with each ad\'s rank, previous rank, peak rank and days running. category: all (default), breakout (fast risers) or evergreen (long-running performers). Takes the numeric Facebook page ID. When hasMore is true call again with offset set to nextOffset. Fails with 403 if the page is not tracked. Costs 1 credit per call.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.rankedAds,
  props: {
    pageId: Property.ShortText({ displayName: 'Facebook Page ID', required: true }),
    category: Property.StaticDropdown({ displayName: 'Category', required: false, options: { options: [{ label: 'All', value: 'all' }, { label: 'Breakout', value: 'breakout' }, { label: 'Evergreen', value: 'evergreen' }] } }),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 100, default 20.', required: false }),
    offset: Property.Number({ displayName: 'Offset', description: 'nextOffset from the previous page.', required: false }),
  },
  async run({ auth, propsValue }) {
    const pageId = foreplayProps.pageId({ value: propsValue.pageId, label: 'Facebook Page ID' });
    const limit = foreplayProps.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 100 }) ?? 20;
    const offset = foreplayProps.parseInteger({ value: propsValue.offset, label: 'Offset', min: 0, max: Number.MAX_SAFE_INTEGER }) ?? 0;
    const response = await foreplayClient.request({
      auth,
      path: `/api/spyder/brand/rankings/${foreplayClient.pathId(pageId)}/list`,
      query: { category: foreplayProps.enumValue({ value: propsValue.category, label: 'Category', allowed: CATEGORIES }), limit, offset },
    });
    const { recordOf, arrayOf, str, num } = foreplayMappers;
    const data = recordOf(foreplayMappers.dataOf(response.body));
    const items = arrayOf(data['ads']).map(foreplayMappers.rankedAd);
    const pagination = recordOf(data['pagination']);
    const total = num(pagination['total']);
    const hasMore = pagination['hasMore'] === true || pagination['has_more'] === true || (total !== null && offset + items.length < total);
    const counts = data['counts'];
    return {
      pageId: str(data['pageId']) ?? str(data['page_id']) ?? pageId,
      date: str(data['date']),
      category: str(data['category']),
      items,
      count: items.length,
      total,
      hasMore: hasMore && items.length > 0,
      nextOffset: hasMore && items.length > 0 ? offset + items.length : null,
      counts: foreplayClient.isRecord(counts) ? counts : null,
      ...foreplayMappers.credits(response),
    };
  },
});

export { listSpyderRankedAds };
