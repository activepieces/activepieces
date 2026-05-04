import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { engagebayAuth } from '../auth';
import { engagebayRequest } from '../common/client';

export const createContactAction = createAction({
  auth: engagebayAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Create a new contact in EngageBay.',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
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
    const { first_name, last_name, email, phone, company } = context.propsValue;

    const properties: { name: string; value: string }[] = [
      { name: 'first_name', value: first_name },
      { name: 'email', value: email },
    ];

    if (last_name) properties.push({ name: 'last_name', value: last_name });
    if (phone) properties.push({ name: 'phone', value: phone });
    if (company) properties.push({ name: 'company', value: company });

    return await engagebayRequest({
      apiKey: context.auth,
      method: HttpMethod.POST,
      path: '/api/panel/users/contacts',
      body: { properties },
    });
  },
});
