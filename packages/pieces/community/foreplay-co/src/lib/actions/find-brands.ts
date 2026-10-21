import { createAction, Property } from '@activepieces/pieces-framework';
import { foreplayCoAuth } from '../auth';
import { foreplayClient } from '../common/client';
import { foreplayMappers } from '../common/mappers';
import { foreplayOutputSchemas } from '../common/output-schemas';
import { foreplayProps } from '../common/props';

const findBrands = createAction({
  auth: foreplayCoAuth,
  name: 'findBrands',
  classification: 'SEARCH',
  displayName: 'Find Brands',
  description: 'Search for brands by name. Costs 1 Foreplay credit per search.',
  audience: 'human',
  aiMetadata: {
    description: 'Search Foreplay brands by name and return raw brand objects with their IDs and Facebook page IDs. Costs 1 credit per call.',
    idempotent: true,
  },
  outputSchema: foreplayOutputSchemas.rawBrands,
  props: {
    query: Property.ShortText({ displayName: 'Brand Name', description: 'Brand name to search for, e.g. Nike.', required: true }),
    limit: Property.Number({ displayName: 'Limit', description: 'Number of brands to return (1 to 100).', required: false, defaultValue: 10 }),
  },
  async run({ auth, propsValue }) {
    const response = await foreplayClient.request({
      auth,
      path: '/api/discovery/brands',
      query: {
        query: foreplayProps.requiredText({ value: propsValue.query, label: 'Brand Name' }),
        limit: foreplayProps.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 100 }),
      },
    });
    return foreplayMappers.listOf(response.body);
  },
});

export { findBrands };
