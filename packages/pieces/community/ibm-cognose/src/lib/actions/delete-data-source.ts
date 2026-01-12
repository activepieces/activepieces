import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ibmCognoseAuth } from '../../index';
import { CognosClient } from '../common/cognos-client';
import { dataSourceDropdown } from '../common/data-source-dropdown';

export const deleteDataSourceAction = createAction({
  auth: ibmCognoseAuth,
  name: 'delete_data_source',
  displayName: 'Delete Data Source',
  description: 'Delete a data source',
  props: {
    datasourceId: dataSourceDropdown,
  },
  async run({ auth, propsValue }) {
    const { datasourceId } = propsValue;

    try {
      const client = new CognosClient(auth.props);

      const response = await client.makeAuthenticatedRequest(
        `/dataSources/${datasourceId}`, 
        HttpMethod.DELETE
      );

      if (response.status === 204) {
        return {
          success: true,
          message: `Data source deleted successfully`,
        };
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Check your credentials.');
      } else if (response.status === 404) {
        throw new Error(`Data source not found`);
      } else {
        throw new Error(`Failed to delete: ${response.status} ${response.body}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to delete data source: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});