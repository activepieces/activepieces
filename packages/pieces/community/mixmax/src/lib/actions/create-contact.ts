import { createAction, Property } from '@activepieces/pieces-framework';
import { mixmaxAuth } from '../..';
import { mixmaxPostRequest } from '../common';

export const createContact = createAction({
  auth: mixmaxAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Create a new contact in Mixmax. [See the documentation](https://developer.mixmax.com/reference/contacts-1)',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The contact email address',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'The contact first name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The contact last name',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The contact company name',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The contact job title',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      email: propsValue.email,
    };
    if (propsValue.firstName) body['firstName'] = propsValue.firstName;
    if (propsValue.lastName) body['lastName'] = propsValue.lastName;
    if (propsValue.company) body['company'] = propsValue.company;
    if (propsValue.title) body['title'] = propsValue.title;

    const response = await mixmaxPostRequest(auth, '/contacts', body);
    return response.body;
  },
});
