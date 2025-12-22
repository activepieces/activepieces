import { createAction, Property } from '@activepieces/pieces-framework';
import { SMSAPIAuth } from '../common/auth';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const createContact = createAction({
  auth: SMSAPIAuth,
  name: 'createContact',
  displayName: 'Create Contact',
  description: 'Create a new contact in SMSAPI contacts database',
  props: {
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number (e.g., 48500000000)',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the contact',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the contact',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the contact',
      required: false,
    }),

    gender: Property.StaticDropdown({
      displayName: 'Gender',
      description: 'Gender of the contact',
      required: false,
      options: {
        options: [
          { label: 'Male', value: 'male' },
          { label: 'Female', value: 'female' },
        ],
      },
    }),
    birthday_date: Property.DateTime({
      displayName: 'Birthday Date',
      description: 'Birthday date in format YYYY-MM-DD',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Description',
      required: false,
    }),
    groups: Property.ShortText({
      displayName: 'Groups',
      description:
        'Comma-separated list of group names to assign the contact to',
      required: false,
      defaultValue: 'default',
    }),
  },
  async run(context) {
    const {
      phone_number,
      first_name,
      last_name,
      email,
      gender,
      birthday_date,
      city,
      description,
      groups,
    } = context.propsValue;

    const body: any = {
      phone_number,
    };

    if (first_name) body.first_name = first_name;
    if (last_name) body.last_name = last_name;
    if (email) body.email = email;
    if (gender) body.gender = gender;
    if (birthday_date) body.birthday_date = birthday_date;
    if (city) body.city = city;
    if (description) body.description = description;
    if (groups) body.groups = groups;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.smsapi.com/contacts',
      headers: {
        Authorization: `Bearer ${context.auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});
