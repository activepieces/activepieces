import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../common/auth';
import { resourceTypeDropdown, publicIdsDropdown, tagsDropdown } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const deleteResource = createAction({
  auth: cloudinaryAuth,
  name: 'deleteResource',
  displayName: 'Delete Resource',
  description: 'Permanently delete images, videos, or files from Cloudinary.',
  props: {
    deletion_mode: Property.StaticDropdown({
      displayName: 'Deletion Mode',
      description: 'Choose how to specify assets for deletion',
      required: true,
      options: {
        options: [
          { label: 'By Public IDs', value: 'public_ids' },
          { label: 'By Tag', value: 'tag' },
          { label: 'By Prefix', value: 'prefix' },
        ],
      },
      defaultValue: 'public_ids',
    }),
    resource_type: resourceTypeDropdown,
    public_ids_dropdown: publicIdsDropdown,
    public_ids_manual: Property.LongText({
      displayName: 'Manual Public IDs',
      description: 'Or type comma-separated public IDs manually (up to 100). Example: image1,image2,folder/image3',
      required: false,
    }),
    tag_dropdown: tagsDropdown,
    tag_manual: Property.ShortText({
      displayName: 'Manual Tag',
      description: 'Or type tag name manually to delete all assets with this tag (up to 1000 assets)',
      required: false,
    }),
    prefix: Property.ShortText({
      displayName: 'Prefix',
      description: 'Delete all assets whose public ID starts with this prefix (up to 1000 assets)',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Delivery Type',
      description: 'The delivery type of assets to delete',
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
    keep_original: Property.Checkbox({
      displayName: 'Keep Original',
      description: 'Delete only derived assets, keep the original',
      required: false,
      defaultValue: false,
    }),
    invalidate: Property.Checkbox({
      displayName: 'Invalidate CDN Cache',
      description: 'Whether to invalidate CDN cached copies. Takes a few minutes to propagate.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { 
      deletion_mode, 
      resource_type, 
      public_ids_dropdown,
      public_ids_manual, 
      tag_dropdown,
      tag_manual, 
      prefix, 
      type, 
      keep_original, 
      invalidate 
    } = propsValue;

    const FormData = (await import('form-data')).default;
    const form = new FormData();

    if (deletion_mode === 'tag') {
      const tag = (tag_dropdown as string) || tag_manual;
      if (!tag) {
        throw new Error('Please select or enter a tag for deletion.');
      }
      
      const path = `/resources/${resource_type}/tags/${encodeURIComponent(tag)}`;
      
      if (keep_original) form.append('keep_original', keep_original.toString());
      if (invalidate) form.append('invalidate', invalidate.toString());

      return await makeRequest(auth, HttpMethod.DELETE, path, form);
    } else if (deletion_mode === 'public_ids') {
      let ids: string[] = [];
      
      if (public_ids_dropdown && Array.isArray(public_ids_dropdown) && public_ids_dropdown.length > 0) {
        ids = public_ids_dropdown as string[];
      } else if (public_ids_manual) {
        ids = public_ids_manual.split(',').map(id => id.trim()).filter(id => id);
      }
      
      if (ids.length === 0) {
        throw new Error('Please select assets from dropdown or enter public IDs manually.');
      }
      
      ids.forEach(id => form.append('public_ids[]', id));
    } else if (deletion_mode === 'prefix' && prefix) {
      form.append('prefix', prefix);
    } else {
      throw new Error(`Please provide ${deletion_mode} for deletion.`);
    }

    // Add optional parameters
    if (keep_original) form.append('keep_original', keep_original.toString());
    if (invalidate) form.append('invalidate', invalidate.toString());

    // Use standard endpoint for public_ids and prefix modes
    const path = `/resources/${resource_type}/${type}`;

    return await makeRequest(auth, HttpMethod.DELETE, path, form);
  },
});
