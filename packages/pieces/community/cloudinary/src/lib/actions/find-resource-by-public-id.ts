import { createAction, Property } from '@activepieces/pieces-framework';
import { resourceDropdown, resourceTypeDropdown } from '../common/props';
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
    public_id: Property.ShortText({
      displayName: 'Public Id ',
      description: '',
      required: true
    })
  },
  async run({ auth, propsValue }) {

    const resource_type = propsValue.resource_type
    const path = `/resources/${resource_type}/upload`;
    return await makeRequest(auth, HttpMethod.GET, path);
  },
});
