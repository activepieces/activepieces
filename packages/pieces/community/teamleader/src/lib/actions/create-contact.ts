import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createContact = createAction({
  auth: teamleaderAuth,
  name: 'createContact',
  displayName: 'Create Contact',
  description: 'Create a new contact in Teamleader',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the contact',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the contact',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email address of the contact',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'The phone number of the contact',
      required: false,
    }),
    website: Property.ShortText({
      displayName: 'Website',
      description: 'The website of the contact',
      required: false,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'The language code (e.g., en, nl, fr, de)',
      required: false,
    }),
  },
  async run(context) {
    const requestBody = {
      first_name: context.propsValue.firstName,
      last_name: context.propsValue.lastName,
      emails: context.propsValue.email
        ? [{ type: 'primary', email: context.propsValue.email }]
        : [],
      telephones: context.propsValue.phone
        ? [{ type: 'primary', number: context.propsValue.phone }]
        : [],
      website: context.propsValue.website,
      language: context.propsValue.language,
    };

    const response = await makeRequest(
      context.auth.access_token,
      HttpMethod.POST,
      '/contacts.add',
      requestBody
    );

    return response;
  },
});
