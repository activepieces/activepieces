import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { CognosClient } from './cognos-client';
import { ibmCognoseAuth } from '../..';

export const contentObjectDropdown = Property.Dropdown({
  auth: ibmCognoseAuth,
  displayName: 'Content Object',
  description: 'Select a content object',
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
      const response = await client.makeAuthenticatedRequest('/content', HttpMethod.GET);

      if (response.status === 200) {
        const data = response.body;
        const contentObjects = data.content || [];
        
        if (contentObjects.length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'No content objects found'
          };
        }
        
        return {
          disabled: false,
          options: contentObjects.map((obj: any) => ({
            label: `${obj.defaultName || 'Unnamed'} (${obj.type || 'Unknown'})`,
            value: obj.id
          }))
        };
      } else {
        return {
          disabled: true,
          options: [],
          placeholder: 'Failed to load content objects'
        };
      }
    } catch (error) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Error loading content objects'
      };
    }
  }
});