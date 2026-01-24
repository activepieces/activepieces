import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { CognosClient } from './cognos-client';
import { ibmCognoseAuth } from '../..';

export const dataSourceDropdown = Property.Dropdown({
  auth: ibmCognoseAuth,
  displayName: 'Data Source',
  description: 'Select a data source',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Connect your account first'
      };
    }

    try {
      const client = new CognosClient(auth.props);
      const response = await client.makeAuthenticatedRequest('/dataSources', HttpMethod.GET);

      if (response.status === 200) {
        const data = response.body;
        const dataSources = data.dataSources || [];
        
        if (dataSources.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No data sources found'
          };
        }
        
        return {
          disabled: false,
          options: dataSources.map((ds: any) => ({
            label: ds.defaultName || ds.id,
            value: ds.id
          }))
        };
      } else {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load data sources'
        };
      }
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading data sources'
      };
    }
  }
});