import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateContact = createAction({
  auth: teamleaderAuth,
  name: 'updateContact',
  displayName: 'Update Contact',
  description: 'Update an existing contact in Teamleader',
  props: {
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'The ID of the contact to update',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the contact',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the contact',
      required: false,
    }),
    emails: Property.Array({
      displayName: 'Email',
      description: 'The email address of the contact',
      required: false,
      properties: {
        type: Property.ShortText({
          displayName: 'Type',
          description: 'Type of email (e.g., primary, secondary)',
          required: true,
        }),
        email: Property.ShortText({
          displayName: 'Email',
          description: 'The email address',
          required: true,
        }),
      },
    }),
    telephones: Property.Array({
      displayName: 'Phone',
      description: 'The phone number of the contact',
      required: false,
      properties: {
        type: Property.ShortText({
          displayName: 'Type',
          description: 'Type of phone (e.g., mobile, landline)',
          required: true,
        }),
        number: Property.ShortText({
          displayName: 'Number',
          description: 'The phone number',
          required: true,
        }),
      },
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
    gender: Property.StaticDropdown({
      displayName: 'Gender',
      description: 'The gender of the contact',
      required: false,
      options: {
        options: [
          { label: 'Female', value: 'female' },
          { label: 'Male', value: 'male' },
          { label: 'Non-binary', value: 'non_binary' },
          { label: 'Prefers not to say', value: 'prefers_not_to_say' },
          { label: 'Unknown', value: 'unknown' },
        ],
      },
    }),
    birthdate: Property.DateTime({
      displayName: 'Birthdate',
      description: 'The birthdate of the contact',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      contact_id,
      first_name,
      last_name,
      emails,
      telephones,
      website,
      language,
      gender,
      birthdate,
    } = propsValue;

    const requestBody = {
      contact_id,
      first_name,
      last_name,
      emails,
      telephones,
      website,
      language,
      gender,
      birthdate,
    };

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/contacts.update',
      requestBody
    );

    return response;
  },
});
