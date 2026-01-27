import { createAction, Property } from '@activepieces/pieces-framework';
import { echowinAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const createContact = createAction({
  auth: echowinAuth,
  name: 'createContact',
  displayName: 'Create Contact',
  description:
    'Create a new contact with optional tags, custom fields, notes, and board assignments',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: "Contact's first name",
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: "Contact's last name",
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: "Contact's email address",
      required: false,
    }),
    number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Contact phone number (will be automatically cleaned)',
      required: true,
    }),
    carrier: Property.ShortText({
      displayName: 'Phone Carrier',
      description: 'Phone carrier name',
      required: false,
    }),
  },
  async run(context) {
    const { firstName, lastName, email, number, carrier } =
      context.propsValue;

    const payload: any = {
      number,
    };
    if (firstName) {
      payload.firstName = firstName;
    }
    if (lastName) {
      payload.lastName = lastName;
    }
    if (email) {
      payload.email = email;
    }
    if (carrier) {
      payload.carrier = carrier;
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      '/contacts',
      payload
    );

    return response.body;
  },
});
