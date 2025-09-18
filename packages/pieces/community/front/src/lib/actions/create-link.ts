import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createLink = createAction({
  auth: frontAuth,
  name: 'create_link',
  displayName: 'Create Link',
  description: 'Create a “Link” in Front (name, external URL).',
  props: {
    external_url: Property.ShortText({
      displayName: 'External URL',
      description: 'The URL the link should point to.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'A custom name for the link. If not provided, the URL will be used.',
      required: false,
    }),
  },
  async run(context) {
    const { ...body } = context.propsValue;
    const token = context.auth;

    // Clean up optional fields
    if (!body.name) {
        delete body.name;
    }

    return await makeRequest(
        token,
        HttpMethod.POST,
        '/links',
        body
    );
  },
});