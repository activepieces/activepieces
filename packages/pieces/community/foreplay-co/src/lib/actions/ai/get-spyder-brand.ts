import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../../auth';
import { foreplayClient } from '../../common/client';
import { foreplayMappers } from '../../common/mappers';
import { foreplayOutputSchemas } from '../../common/output-schemas';
import { foreplayProps } from '../../common/props';

const getSpyderBrand = createAction({
  auth: foreplayCoAuth,
  name: 'get_spyder_brand',
  classification: 'READ',
  displayName: 'Get Spyder Brand',
  description: 'Get one brand from your Spyder watchlist.',
  audience: 'ai',
  aiMetadata: {
    description: 'Returns one brand from the user\'s Spyder watchlist by Foreplay brand ID (from List Spyder Brands). Fails with 403/404 if the brand is not tracked. Costs 1 credit.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.brand,
  props: {
    brandId: Property.ShortText({ displayName: 'Brand ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await foreplayClient.request({
      auth,
      path: '/api/spyder/brand',
      query: { brand_id: foreplayProps.foreplayId({ value: propsValue.brandId, label: 'Brand ID' }) },
    });
    return foreplayMappers.single({ response, map: foreplayMappers.brand });
  },
});

export { getSpyderBrand };
