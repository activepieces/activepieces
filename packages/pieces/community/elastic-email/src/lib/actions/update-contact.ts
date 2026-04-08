import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { elasticEmailAuth } from '../auth';
import { elasticEmailRequest } from '../common/client';
import { contactEmailProp } from '../common/props';

export const updateContactAction = createAction({
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Update an existing contact in Elastic Email.',
  auth: elasticEmailAuth,
  props: {
    contact: contactEmailProp,
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
      method: HttpMethod.PUT,
      path: `/contacts/${encodeURIComponent(String(propsValue.contact))}`,
      body: {
        FirstName: propsValue.firstName ?? undefined,
        LastName: propsValue.lastName ?? undefined,
        CustomFields: propsValue.customFields ?? undefined,
      },
    });
  },
});
