import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';
import { foreplayProps } from '../../common/props';

const listBrandAds = createAction({
  auth: foreplayCoAuth,
  name: 'list_brand_ads',
  classification: 'SEARCH',
  displayName: 'List Brand Ads',
  description: 'List ads for one or more Foreplay brand IDs.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists ads of one or more brands by Foreplay brand ID (id field from Search Brands or Find Brands by Domain), with optional filters. Costs 1 credit per ad returned (default limit 10, max 250). If empty because the brand is not indexed yet, call again with collectIfEmpty true (waits up to ~30 s). When hasMore is true call again with cursor set to nextCursor.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.adCursorPage,
  props: {
    brandIds: Property.Array({ displayName: 'Brand IDs', required: true }),
    ...foreplayProps.aiAdFilterProps(),
    order: foreplayProps.sortOrderProp(),
    collectIfEmpty: Property.Checkbox({ displayName: 'Collect If Empty', description: 'Fetch from Meta when nothing is cached (waits up to ~30 s).', required: false, defaultValue: false }),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 250, default 10. 1 credit per ad returned.', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'nextCursor from the previous page.', required: false }),
  },
  async run({ auth, propsValue }) {
    const brandIds = (foreplayProps.stringList({ value: propsValue.brandIds, label: 'Brand IDs' }) ?? []).map((value) => foreplayProps.foreplayId({ value, label: 'Brand ID' }));
    if (brandIds.length === 0) throw new Error('Brand IDs is required.');
    if (brandIds.length > 50) throw new Error('Pass at most 50 brand IDs per call.');
    const limit = foreplayProps.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 250 }) ?? 10;
    const response = await foreplayClient.request({
      auth,
      path: '/api/brand/getAdsByBrandId',
      query: {
        brand_ids: brandIds,
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

export { listBrandAds };
