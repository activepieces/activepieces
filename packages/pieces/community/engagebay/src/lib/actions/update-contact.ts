import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { engagebayAuth } from '../auth';
import { engagebayRequest } from '../common/client';

export const updateContactAction = createAction({
  auth: engagebayAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Update an existing contact in EngageBay.',
  props: {
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      required: false,
    }),
  },
  async run(context) {
    const { contact_id, first_name, last_name, email, phone, company } = context.propsValue;

    const properties: { name: string; value: string }[] = [];

    if (first_name) properties.push({ name: 'first_name', value: first_name });
    if (last_name) properties.push({ name: 'last_name', value: last_name });
    if (email) properties.push({ name: 'email', value: email });
    if (phone) properties.push({ name: 'phone', value: phone });
    if (company) properties.push({ name: 'company', value: company });

    return await engagebayRequest({
      apiKey: context.auth,
      method: HttpMethod.PUT,
      path: '/api/panel/users/contacts',
      body: { id: contact_id, properties },
    });
  },
});
