import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';
import { foreplayProps } from '../../common/props';

const listSpyderBrands = createAction({
  auth: foreplayCoAuth,
  name: 'list_spyder_brands',
  classification: 'SEARCH',
  displayName: 'List Spyder Brands',
  description: 'List the brands you track in Spyder.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists brands on the user\'s Spyder watchlist, 10 per page. The brand ID works with Get Spyder Brand and List Spyder Brand Ads; the pageId works with the Spyder ranking actions. When hasMore is true call again with offset set to nextOffset. Costs 1 credit per call.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.brandOffsetPage,
  props: {
    limit: Property.Number({ displayName: 'Limit', description: '1 to 10, default 10.', required: false }),
    offset: Property.Number({ displayName: 'Offset', description: 'nextOffset from the previous page.', required: false }),
  },
  async run({ auth, propsValue }) {
    const limit = foreplayProps.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 10 }) ?? 10;
    const offset = foreplayProps.parseInteger({ value: propsValue.offset, label: 'Offset', min: 0, max: Number.MAX_SAFE_INTEGER }) ?? 0;
    const response = await foreplayClient.request({ auth, path: '/api/spyder/brands', query: { limit, offset } });
    return foreplayMappers.offsetPage({ response, map: foreplayMappers.brand, limit, offset });
  },
});

export { listSpyderBrands };
