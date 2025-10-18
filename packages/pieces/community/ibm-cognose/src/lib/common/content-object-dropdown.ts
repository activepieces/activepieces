import { Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { CognosClient } from './cognos-client';

export const contentObjectDropdown = Property.Dropdown({
  displayName: 'Content Object',
  description: 'Select a content object',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please authenticate first'
      };
    }

    try {
      const client = new CognosClient(auth as any);
      const response = await client.makeAuthenticatedRequest('/content', HttpMethod.GET);

      if (response.status === 200) {
        const data = response.body;
        const contentObjects = data.content || [];
        
        return {
          disabled: false,
          options: contentObjects.map((obj: any) => ({
            label: `${obj.defaultName || 'Unnamed'} (${obj.type || 'Unknown'}) - ${obj.id}`,
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