import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';
import { foreplayProps } from '../../common/props';

const listSpyderRelatedPages = createAction({
  auth: foreplayCoAuth,
  name: 'list_spyder_related_pages',
  classification: 'SEARCH',
  displayName: 'List Spyder Related Pages',
  description: 'Pages and brands often seen alongside a tracked page (lookalikes, competitors).',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns pages/brands frequently seen alongside a page on the user\'s Spyder watchlist, useful for competitor and lookalike research. Each result has the page ID, name, Foreplay brand ID, likes and ad counts. Takes the numeric Facebook page ID; limit 1 to 50 (default 5). Fails with 403 if the page is not tracked. Costs 1 credit.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.relatedPages,
  props: {
    pageId: Property.ShortText({ displayName: 'Facebook Page ID', required: true }),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 50, default 5.', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await foreplayClient.request({
      auth,
      path: '/api/spyder/brand/partners',
      query: {
        pageId: foreplayProps.pageId({ value: propsValue.pageId, label: 'Facebook Page ID' }),
        limit: foreplayProps.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 50 }) ?? 5,
      },
    });
    const data = foreplayMappers.dataOf(response.body);
    const rows = Array.isArray(data) ? data : foreplayMappers.arrayOf(foreplayMappers.recordOf(data)['results']);
    const items = rows.map(foreplayMappers.relatedPage);
    return { items, count: items.length, ...foreplayMappers.credits(response) };
  },
});

export { listSpyderRelatedPages };
