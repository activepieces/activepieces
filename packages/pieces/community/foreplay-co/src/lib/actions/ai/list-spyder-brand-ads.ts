import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';
import { foreplayProps } from '../../common/props';

const listSpyderBrandAds = createAction({
  auth: foreplayCoAuth,
  name: 'list_spyder_brand_ads',
  classification: 'SEARCH',
  displayName: 'List Spyder Brand Ads',
  description: 'List ads of a brand you track in Spyder.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists ads of one brand on the user\'s Spyder watchlist (brand ID from List Spyder Brands), newest first by default, with optional filters. Costs 1 credit per ad returned (default limit 10, max 250). When hasMore is true call again with cursor set to nextCursor.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.adCursorPage,
  props: {
    brandId: Property.ShortText({ displayName: 'Brand ID', required: true }),
    ...foreplayProps.aiAdFilterProps(),
    order: foreplayProps.sortOrderProp(),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 250, default 10. 1 credit per ad returned.', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'nextCursor from the previous page.', required: false }),
  },
  async run({ auth, propsValue }) {
    const limit = foreplayProps.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 250 }) ?? 10;
    const response = await foreplayClient.request({
      auth,
      path: '/api/spyder/brand/ads',
      query: {
        brand_id: foreplayProps.foreplayId({ value: propsValue.brandId, label: 'Brand ID' }),
        ...foreplayProps.adFilterQuery(foreplayProps.aiAdFilterInput(propsValue)),
        order: foreplayProps.enumValue({ value: propsValue.order, label: 'Order', allowed: foreplayProps.SORT_ORDERS }),
        cursor: foreplayProps.optionalText(propsValue.cursor),
        limit,
      },
    });
    return foreplayMappers.cursorPage({ response, map: foreplayMappers.ad, limit });
  },
});

export { listSpyderBrandAds };
