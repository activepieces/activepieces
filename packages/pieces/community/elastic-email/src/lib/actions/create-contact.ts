import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { elasticEmailAuth } from '../auth';
import { elasticEmailRequest } from '../common/client';
import { CONTACT_STATUS_OPTIONS } from '../common/constants';

export const createContactAction = createAction({
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Create a new contact in Elastic Email.',
  auth: elasticEmailAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact.',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Initial status of the contact.',
      required: false,
      options: {
        options: CONTACT_STATUS_OPTIONS.map((s) => ({ label: s, value: s })),
      },
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    customFields: Property.Object({
      displayName: 'Custom Fields',
      description:
        'Key-value pairs of custom contact fields. Only existing custom fields will be saved.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return elasticEmailRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/contacts',
      body: [
        {
          Email: propsValue.email,
          Status: propsValue.status ?? undefined,
          FirstName: propsValue.firstName ?? undefined,
          LastName: propsValue.lastName ?? undefined,
          CustomFields: propsValue.customFields ?? undefined,
        },
      ],
    });
  },
});
