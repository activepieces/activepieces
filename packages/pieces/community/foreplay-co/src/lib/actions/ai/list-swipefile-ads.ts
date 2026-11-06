import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';
import { foreplayProps } from '../../common/props';

const listSwipefileAds = createAction({
  auth: foreplayCoAuth,
  name: 'list_swipefile_ads',
  classification: 'SEARCH',
  displayName: 'List Swipe File Ads',
  description: 'List the ads saved in your swipe file.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists ads the user saved to their Foreplay swipe file, newest saved first by default, with optional filters. Costs 1 credit per ad returned (default limit 10, max 250). When hasMore is true call again with offset set to nextOffset.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.adOffsetPage,
  props: {
    ...foreplayProps.aiAdFilterProps(),
    order: foreplayProps.sortOrderProp({ allowed: foreplayProps.SWIPEFILE_ORDERS }),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 250, default 10. 1 credit per ad returned.', required: false }),
    offset: Property.Number({ displayName: 'Offset', description: 'nextOffset from the previous page.', required: false }),
  },
  async run({ auth, propsValue }) {
    const limit = foreplayProps.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 250 }) ?? 10;
    const offset = foreplayProps.parseInteger({ value: propsValue.offset, label: 'Offset', min: 0, max: Number.MAX_SAFE_INTEGER }) ?? 0;
    const response = await foreplayClient.request({
      auth,
      path: '/api/swipefile/ads',
      query: {
        ...foreplayProps.adFilterQuery(foreplayProps.aiAdFilterInput(propsValue)),
        order: foreplayProps.enumValue({ value: propsValue.order, label: 'Order', allowed: foreplayProps.SWIPEFILE_ORDERS }),
        limit,
        offset,
      },
    });
    return foreplayMappers.offsetPage({ response, map: foreplayMappers.ad, limit, offset });
  },
});

export { listSwipefileAds };
