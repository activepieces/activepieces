import { createAction, Property } from '@activepieces/pieces-framework';
import { cloudinaryAuth } from '../common/auth';
import { resourceAssetIdsDropdown, resourceTypeDropdown } from '../common/props';
import FormData from 'form-data';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';

export const deleteResource = createAction({
  auth: cloudinaryAuth,
  name: 'deleteResource',
  displayName: 'Delete Resource',
  description: 'Delete an image, video, or file from Cloudinary.',
  props: {
    resource_type: resourceTypeDropdown,
    resource_asset_ids: resourceAssetIdsDropdown,
  },
  async run({ auth, propsValue }) {
    const { resource_type, resource_asset_ids } = propsValue;

    const form = new FormData();
    for (const assetId of resource_asset_ids) {
      form.append('asset_ids[]', assetId);
    }

    const path = `/resources`;

    return await makeRequest(auth, HttpMethod.DELETE, path, form);
  },
});
