import { createAction, Property } from '@activepieces/pieces-framework';
import { intruderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const addTarget = createAction({
  auth: intruderAuth,
  name: 'addTarget',
  displayName: 'Add Target',
  description: 'Add a new target to your Intruder account',
  props: {
    address: Property.ShortText({
      displayName: 'Target Address',
      description:
        'The address or domain of the target (e.g., example.com, 192.168.1.1)',
      required: true,
    }),

    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to organize and filter targets',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: {
      address: string;
      tags?: string[];
    } = {
      address: propsValue.address,
    };

    if (propsValue.tags && propsValue.tags.length > 0) {
      body.tags = propsValue.tags as string[];
    }

    const response = await makeRequest(
      auth.secret_text,
      HttpMethod.POST,
      '/targets/',
      body
    );

    return response;
  },
});
