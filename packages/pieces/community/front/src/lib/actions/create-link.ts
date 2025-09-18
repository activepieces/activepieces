import { createAction, Property } from '@activepieces/pieces-framework';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createLink = createAction({
  auth: frontAuth,
  name: 'create_link',
  displayName: 'Create Link',
  description:
    'Create a new link in Front (e.g., to an external ticket or document).',
  props: {
    external_url: Property.ShortText({
      displayName: 'External URL',
      description: 'The external URL you want the link to point to.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'A custom name or title for the link.',
      required: false,
    }),
    type: Property.ShortText({
      displayName: 'Type',
      description:
        'The type of the link, used for categorization in custom integrations.',
      required: false,
    }),
    custom_fields: Property.Json({
      displayName: 'Custom Fields',
      description: 'Custom fields for this link as a JSON object.',
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth;
    const body = context.propsValue;

    return await makeRequest(token, HttpMethod.POST, '/links', body);
  },
});

