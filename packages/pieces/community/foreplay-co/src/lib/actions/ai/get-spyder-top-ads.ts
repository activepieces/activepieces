import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';
import { foreplayProps } from '../../common/props';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

const getSpyderTopAds = createAction({
  auth: foreplayCoAuth,
  name: 'get_spyder_top_ads',
  classification: 'READ',
  displayName: 'Get Spyder Top Ads',
  description: 'Top-ranked ads of a tracked page compared with an earlier date.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns the top-ranked ads of a page on the user\'s Spyder watchlist with their rank now and N days ago (compareDaysAgo, default 7), so you can say which ads climbed or dropped. Takes the numeric Facebook page ID (pageId from List Spyder Brands) and an anchor date (YYYY-MM-DD, default today UTC). Fails with 403 if the page is not tracked in Spyder. Costs 1 credit.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.topAds,
  props: {
    pageId: Property.ShortText({ displayName: 'Facebook Page ID', required: true }),
    date: Property.ShortText({ displayName: 'Date', description: 'YYYY-MM-DD, default today (UTC).', required: false }),
    compareDaysAgo: Property.Number({ displayName: 'Compare With (days ago)', description: '1 to 365, default 7.', required: false }),
  },
  async run({ auth, propsValue }) {
    const pageId = foreplayProps.pageId({ value: propsValue.pageId, label: 'Facebook Page ID' });
    const response = await foreplayClient.request({
      auth,
      path: `/api/spyder/brand/rankings/${foreplayClient.pathId(pageId)}/top-overview`,
      query: {
        date: foreplayProps.dayOnly({ value: propsValue.date, label: 'Date' }) ?? today(),
        compareDaysAgo: foreplayProps.parseInteger({ value: propsValue.compareDaysAgo, label: 'Compare With (days ago)', min: 1, max: 365 }) ?? 7,
      },
    });
    const data = foreplayMappers.recordOf(foreplayMappers.dataOf(response.body));
    const items = foreplayMappers.arrayOf(data['ads']).map(foreplayMappers.rankedAd);
    return {
      pageId: foreplayMappers.str(data['pageId']) ?? foreplayMappers.str(data['page_id']) ?? pageId,
      date: foreplayMappers.str(data['date']),
      compareDaysAgo: foreplayMappers.num(data['compareDaysAgo']) ?? foreplayMappers.num(data['compare_days_ago']),
      items,
      count: items.length,
      ...foreplayMappers.credits(response),
    };
  },
});

export { getSpyderTopAds };
