import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ibmCognoseAuth } from '../../index';
import { CognosClient } from '../common/cognos-client';
import { dataSourceDropdown } from '../common/data-source-dropdown';

export const updateDataSourceAction = createAction({
  auth: ibmCognoseAuth,
  name: 'update_data_source',
  displayName: 'Update Data Source',
  description: 'Updates an existing data source in IBM Cognos Analytics',
  props: {
    datasourceId: dataSourceDropdown,
    defaultName: Property.ShortText({
      displayName: 'Data Source Name',
      description: 'The new name for the data source (optional)',
      required: false,
    }),
    disabled: Property.Checkbox({
      displayName: 'Disabled',
      description: 'Whether the data source should be disabled',
      required: false,
      defaultValue: false,
    }),
    hidden: Property.Checkbox({
      displayName: 'Hidden',
      description: 'Whether the data source should be hidden',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { datasourceId, defaultName, disabled, hidden } = propsValue;

    // Create Cognos client
    const client = new CognosClient(auth);

    // Build the update definition (only include fields that are provided)
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

    // If no fields to update, return early
    if (Object.keys(updateDefinition).length === 0) {
      throw new Error('At least one field must be provided to update the data source');
    }

    // Update the data source
    const response = await client.makeAuthenticatedRequest(
      `/dataSources/${datasourceId}`, 
      HttpMethod.PUT, 
      updateDefinition
    );

    if (response.status === 204) {
      return {
        success: true,
        message: `Data source '${datasourceId}' updated successfully`,
        updatedFields: updateDefinition,
      };
    } else if (response.status === 401) {
      throw new Error('Authentication required. Please check your credentials.');
    } else if (response.status === 404) {
      throw new Error(`Data source with ID '${datasourceId}' not found`);
    } else {
      throw new Error(`Failed to update data source: ${response.status} ${response.body}`);
    }
  },
});