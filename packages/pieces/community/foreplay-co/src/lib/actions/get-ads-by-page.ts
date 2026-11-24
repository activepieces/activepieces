import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../auth';
import { foreplayClient } from '../common/client';
import { foreplayMappers } from '../common/mappers';
import { foreplayOutputSchemas } from '../common/output-schemas';
import { foreplayProps } from '../common/props';

const getAdsByPage = createAction({
  auth: foreplayCoAuth,
  name: 'getAdsByPage',
  classification: 'SEARCH',
  displayName: 'Get Ads by Page',
  description: 'Get ads for a Facebook Page ID with filtering and pagination. Costs 1 Foreplay credit per ad returned.',
  audience: 'human',
  aiMetadata: {
    description: 'List the ads of one advertiser by numeric Facebook page ID, with optional filters and cursor pagination. Returns raw ad objects. Costs 1 credit per ad returned.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.rawAds,
  props: {
    page_id: Property.ShortText({ displayName: 'Page ID', description: 'The numeric Facebook page ID, e.g. 123456789.', required: true }),
    ...foreplayProps.humanAdFilterProps(),
    order: foreplayProps.sortOrderProp(),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'Cursor from the previous response, for the next page.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Ads per request (1 to 250). 1 credit per ad returned.', required: false, defaultValue: 10 }),
  },
  async run({ auth, propsValue }) {
    const response = await foreplayClient.request({
      auth,
      path: '/api/brand/getAdsByPageId',
      query: {
        page_id: foreplayProps.pageId({ value: propsValue.page_id, label: 'Page ID' }),
        ...foreplayProps.adFilterQuery(foreplayProps.humanAdFilterInput(propsValue)),
        order: foreplayProps.enumValue({ value: propsValue.order, label: 'Order', allowed: foreplayProps.SORT_ORDERS }),
        cursor: foreplayProps.optionalText(propsValue.cursor),
        limit: foreplayProps.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 250 }),
      },
    });
    return foreplayMappers.listOf(response.body);
  },
});

export { getAdsByPage };
