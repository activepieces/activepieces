import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ibmCognoseAuth } from '../../index';
import { CognosClient } from '../common/cognos-client';
import { dataSourceDropdown } from '../common/data-source-dropdown';

export const getDataSourceAction = createAction({
  auth: ibmCognoseAuth,
  name: 'get_data_source',
  displayName: 'Get Data Source',
  description: 'Retrieves the details of a specific data source from IBM Cognos Analytics',
  props: {
    datasourceId: dataSourceDropdown,
    fields: Property.ShortText({
      displayName: 'Extra Fields',
      description: 'Optional comma-separated list of extra fields to retrieve (e.g., "connections,signons")',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { datasourceId, fields } = propsValue;

    // Create Cognos client
    const client = new CognosClient(auth);

    // Build query parameters
    const queryParams = [];
    if (fields && fields.trim()) {
      queryParams.push(`fields=${encodeURIComponent(fields.trim())}`);
    }

    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';

    // Get the data source details
    const response = await client.makeAuthenticatedRequest(
      `/dataSources/${datasourceId}${queryString}`, 
      HttpMethod.GET
    );

    if (response.status === 200) {
      return {
        success: true,
        dataSource: response.body,
      };
    } else if (response.status === 401) {
      throw new Error('Authentication required. Please check your credentials.');
    } else if (response.status === 404) {
      throw new Error(`Data source with ID '${datasourceId}' not found`);
    } else {
      throw new Error(`Failed to retrieve data source: ${response.status} ${response.body}`);
    }
  },
});