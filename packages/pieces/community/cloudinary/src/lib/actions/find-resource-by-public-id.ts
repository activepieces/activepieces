import { createAction, Property } from '@activepieces/pieces-framework';
import { resourceTypeDropdown, publicIdDropdown } from '../common/props';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { cloudinaryAuth } from '../common/auth';

export const findResourceByPublicId = createAction({
  auth: cloudinaryAuth,
  name: 'findResourceByPublicId',
  displayName: 'Find Resource by Public ID',
  description: 'Retrieve details of an asset using its unique public ID.',
  props: {
    resource_type: resourceTypeDropdown,
    public_id_dropdown: publicIdDropdown,
    public_id_manual: Property.ShortText({
      displayName: 'Manual Public ID',
      description: 'Or enter the public ID manually if not found in dropdown (e.g., "sample", "folder/image-name")',
      required: false,
    }),
    delivery_type: Property.StaticDropdown({
      displayName: 'Delivery Type',
      description: 'The delivery type of the asset',
      required: false,
      options: {
        options: [
          { label: 'Upload', value: 'upload' },
          { label: 'Private', value: 'private' },
          { label: 'Authenticated', value: 'authenticated' },
        ],
      },
      defaultValue: 'upload',
    }),
  },
  async run({ auth, propsValue }) {
    const { resource_type, public_id_dropdown, public_id_manual, delivery_type } = propsValue;
    
    const public_id = (public_id_dropdown as string) || (public_id_manual as string);
    
    if (!public_id || !public_id.trim()) {
      throw new Error('Please select an asset from the dropdown or enter a public ID manually.');
    }
    
    const trimmedPublicId = public_id.trim();
    const type = delivery_type || 'upload';
    
    const path = `/resources/${resource_type}/${type}/${encodeURIComponent(trimmedPublicId)}`;
    
    try {
      const response = await makeRequest(auth, HttpMethod.GET, path);
      return {
        found: true,
        resource: response,
        public_id: trimmedPublicId,
        resource_type: resource_type,
        delivery_type: type,
      };
    } catch (error: any) {
      if (error.response?.status === 404 || error.message?.includes('not found')) {
        return {
          found: false,
          message: `Resource with public ID "${trimmedPublicId}" not found in ${resource_type}/${type}`,
          public_id: trimmedPublicId,
          resource_type: resource_type,
          delivery_type: type,
        };
      }
      
      throw error;
    }
  },
});
