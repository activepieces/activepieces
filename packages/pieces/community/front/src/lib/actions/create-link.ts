import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createLink = createAction({
  auth: frontAuth,
  name: 'createLink',
  displayName: 'Create Link',
  description: 'Create a Link in Front (name, external URL).',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The name of the link.',
      required: true,
    }),
    external_url: Property.ShortText({
      displayName: 'External URL',
      description: 'The external URL for the link.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { name, external_url } = propsValue;
    const body = { name, external_url };
    return await makeRequest(auth.access_token, HttpMethod.POST, '/links', body);
  },
});