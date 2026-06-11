import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ibmCognoseAuth } from '../auth';
import { CognosClient } from '../common/cognos-client';
import { dataSourceDropdown } from '../common/data-source-dropdown';

export const updateDataSourceAction = createAction({
  auth: ibmCognoseAuth,
  name: 'update_data_source',
  displayName: 'Update Data Source',
  description: 'Update an existing data source',
  audience: 'both',
  aiMetadata: { description: 'Update an existing IBM Cognos data source identified by its id, changing its name and/or its disabled/hidden flags. At least one field must be supplied. Idempotent: re-applying the same values leaves the data source in the same state.', idempotent: true },
  props: {
    datasourceId: dataSourceDropdown,
    defaultName: Property.ShortText({
      displayName: 'Data Source Name',
      description: 'New name for the data source',
      required: false,
    }),
    disabled: Property.Checkbox({
      displayName: 'Disabled',
      description: 'Disable the data source',
      required: false,
      defaultValue: false,
    }),
    hidden: Property.Checkbox({
      displayName: 'Hidden',
      description: 'Hide the data source',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { datasourceId, defaultName, disabled, hidden } = propsValue;

    try {
      const client = new CognosClient(auth.props);

      const updateDefinition: any = {};
      
      if (defaultName) {
        updateDefinition.defaultName = defaultName;
      }
      
      if (disabled !== undefined) {
        updateDefinition.disabled = disabled;
      }
      
      if (hidden !== undefined) {
        updateDefinition.hidden = hidden;
      }

      if (Object.keys(updateDefinition).length === 0) {
        throw new Error('At least one field must be provided to update');
      }

      const response = await client.makeAuthenticatedRequest(
        `/dataSources/${datasourceId}`, 
        HttpMethod.PUT, 
        updateDefinition
      );

      if (response.status === 204 || response.status === 200) {
        return {
          success: true,
          message: `Data source updated successfully`,
          updatedFields: updateDefinition,
        };
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Check your credentials.');
      } else if (response.status === 404) {
        throw new Error(`Data source not found`);
      } else {
        throw new Error(`Failed to update: ${response.status} ${response.body}`);
      }
    } catch (error) {
      throw new Error(
        `Failed to update data source: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  },
});