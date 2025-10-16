import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ibmCognoseAuth } from '../../index';
import { CognosClient } from '../common/cognos-client';
import { dataSourceDropdown } from '../common/data-source-dropdown';

export const deleteDataSourceAction = createAction({
  auth: ibmCognoseAuth,
  name: 'delete_data_source',
  displayName: 'Delete Data Source',
  description: 'Deletes an existing data source from IBM Cognos Analytics',
  props: {
    datasourceId: dataSourceDropdown,
  },
  async run({ auth, propsValue }) {
    const { datasourceId } = propsValue;

    // Create Cognos client
    const client = new CognosClient(auth);

    // Delete the data source
    const response = await client.makeAuthenticatedRequest(
      `/dataSources/${datasourceId}`, 
      HttpMethod.DELETE
    );

    if (response.status === 204) {
      return {
        success: true,
        message: `Data source '${datasourceId}' deleted successfully`,
      };
    } else if (response.status === 401) {
      throw new Error('Authentication required. Please check your credentials.');
    } else if (response.status === 404) {
      throw new Error(`Data source with ID '${datasourceId}' not found`);
    } else {
      throw new Error(`Failed to delete data source: ${response.status} ${response.body}`);
    }
  },
});