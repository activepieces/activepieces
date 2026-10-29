import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';
import { foreplayProps } from '../../common/props';

const listPageAds = createAction({
  auth: foreplayCoAuth,
  name: 'list_page_ads',
  classification: 'SEARCH',
  displayName: 'List Page Ads',
  description: 'List the ads of one Facebook page.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists ads run by one advertiser, identified by its numeric Facebook page ID (the pageId field of a brand), with optional filters. Costs 1 credit per ad returned (default limit 10, max 250). If the result is empty because Foreplay has not indexed the page yet, call again with collectIfEmpty true: Foreplay then fetches from Meta and the call can take about 30 seconds. When hasMore is true call again with cursor set to nextCursor.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.adCursorPage,
  props: {
    pageId: Property.ShortText({ displayName: 'Facebook Page ID', description: 'Numeric page ID.', required: true }),
    ...foreplayProps.aiAdFilterProps(),
    order: foreplayProps.sortOrderProp(),
    collectIfEmpty: Property.Checkbox({ displayName: 'Collect If Empty', description: 'Fetch from Meta when nothing is cached (waits up to ~30 s).', required: false, defaultValue: false }),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 250, default 10. 1 credit per ad returned.', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'nextCursor from the previous page.', required: false }),
  },
  async run({ auth, propsValue }) {
    const limit = foreplayProps.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 250 }) ?? 10;
    const response = await foreplayClient.request({
      auth,
      path: '/api/brand/getAdsByPageId',
      query: {
        page_id: foreplayProps.pageId({ value: propsValue.pageId, label: 'Facebook Page ID' }),
        ...foreplayProps.adFilterQuery(foreplayProps.aiAdFilterInput(propsValue)),
        order: foreplayProps.enumValue({ value: propsValue.order, label: 'Order', allowed: foreplayProps.SORT_ORDERS }),
        collect: propsValue.collectIfEmpty === true ? true : undefined,
        cursor: foreplayProps.optionalText(propsValue.cursor),
        limit,
      },
    });
    return foreplayMappers.cursorPage({ response, map: foreplayMappers.ad, limit });
  },
});

export { listPageAds };
