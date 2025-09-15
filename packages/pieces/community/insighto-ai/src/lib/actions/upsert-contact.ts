import { createAction, Property } from '@activepieces/pieces-framework';
import { InsightoAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const upsertContact = createAction({
  auth: InsightoAuth,
  name: 'upsertContact',
  displayName: 'Upsert Contact',
  description: '',
  props: {
    firstName: Property.ShortText({
      displayName: "First Name",
      description: "First name of the contact",
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: "Last Name",
      description: "Last name of the contact",
      required: true,
    }),
    email: Property.ShortText({
      displayName: "Email",
      description: "Email address of the contact",
      required: true,
    }),
    phoneNumber: Property.ShortText({
      displayName: "Phone Number",
      description: "Phone number of the contact including country code (e.g. 16501111234)",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { firstName, lastName, email, phoneNumber } = propsValue;

    const body = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: phoneNumber,
    };

    const response = await makeRequest(
      auth,
      HttpMethod.POST,
      `/contact/upsert`,
      body
    );

    return response;
  },
});