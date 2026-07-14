import { createAction, Property } from '@activepieces/pieces-framework';

import { mixmaxAuth } from '../auth';
import { mixmaxApiClient } from '../common';

export const createContact = createAction({
  auth: mixmaxAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description:
    'Create a new contact in Mixmax. [See the documentation](https://developer.mixmax.com/reference/contacts-1)',
  audience: 'both',
  aiMetadata: {
    description:
      'Adds a new contact to the Mixmax contact list, keyed by email (the only required field; name is optional). Optionally enriches the contact with third-party data when enrichment sources are connected. Not idempotent — each call creates/registers the contact again.',
    idempotent: false,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The contact email address',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'The contact full name',
      required: false,
    }),
    enrich: Property.Checkbox({
      displayName: 'Enrich Contact',
      description:
        'Merge third-party data for this contact if enrichment sources are connected',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = { email: propsValue.email };
    if (propsValue.name) body.name = propsValue.name;
    if (propsValue.enrich) body.enrich = propsValue.enrich;

    const response = await mixmaxApiClient.postRequest({
      auth,
      endpoint: '/contacts',
      body,
    });
    return response.body;
  },
});
