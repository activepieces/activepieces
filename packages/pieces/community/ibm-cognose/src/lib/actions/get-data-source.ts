import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ibmCognoseAuth } from '../../index';
import { CognosClient } from '../common/cognos-client';
import { dataSourceDropdown } from '../common/data-source-dropdown';

export const getDataSourceAction = createAction({
  auth: ibmCognoseAuth,
  name: 'get_data_source',
  displayName: 'Get Data Source',
  description: 'Retrieve data source details',
  props: {
    datasourceId: dataSourceDropdown,
    fields: Property.ShortText({
      displayName: 'Extra Fields',
      description: 'Comma-separated list of extra fields (e.g., connections,signons)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { datasourceId, fields } = propsValue;

    try {
      const client = new CognosClient(auth.props);

      const queryParams = [];
      if (fields && fields.trim()) {
        queryParams.push(`fields=${encodeURIComponent(fields.trim())}`);
      }

      const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

      const response = await client.makeAuthenticatedRequest(
        `/dataSources/${datasourceId}${queryString}`, 
        HttpMethod.GET
      );

      if (response.status === 200) {
        return response.body;
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Check your credentials.');
      } else if (response.status === 404) {
        throw new Error(`Data source not found`);
      } else {
        throw new Error(`Failed to retrieve: ${response.status} ${response.body}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to retrieve data source: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});