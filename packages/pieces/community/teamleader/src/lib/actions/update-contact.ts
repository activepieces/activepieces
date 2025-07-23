import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  contactIdDropdown,
  emailTypeDropdown,
  genderDropdown,
} from '../common/props';

export const updateContact = createAction({
  auth: teamleaderAuth,
  name: 'updateContact',
  displayName: 'Update Contact',
  description: 'Update an existing contact in Teamleader',
  props: {
    contact_id: contactIdDropdown,
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
    salutation: Property.ShortText({
      displayName: 'Salutation',
      description: 'The salutation of the contact (e.g., Mr., Ms.)',
      required: false,
    }),
    emails: Property.Array({
      displayName: 'Email',
      description: 'The email address of the contact',
      required: false,
      properties: {
        type: emailTypeDropdown,
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
        type: emailTypeDropdown,
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
    gender: genderDropdown,
    birthdate: Property.DateTime({
      displayName: 'Birthdate',
      description: 'The birthdate of the contact',
      required: false,
    }),
    iban: Property.ShortText({
      displayName: 'IBAN',
      description: 'The IBAN of the contact',
      required: false,
    }),
    bic: Property.ShortText({
      displayName: 'BIC',
      description: 'The BIC of the contact',
      required: false,
    }),
    national_identification_number: Property.ShortText({
      displayName: 'National Identification Number',
      description: 'The national identification number of the contact',
      required: false,
    }),
    remarks: Property.LongText({
      displayName: 'Remarks',
      description: 'Additional remarks about the contact',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags associated with the contact',
      required: false,
    }),
    marketing_mails_consent: Property.Checkbox({
      displayName: 'Marketing Mails Consent',
      description: 'Consent for marketing emails',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const requestBody: Record<string, unknown> = {
      id: propsValue.contact_id,
    };

    // Add optional fields if they are provided
    const optionalFields = {
      first_name: propsValue.first_name,
      last_name: propsValue.last_name,
      salutation: propsValue.salutation,
      emails: propsValue.emails,
      telephones: propsValue.telephones,
      website: propsValue.website,
      language: propsValue.language,
      gender: propsValue.gender,
      birthdate: propsValue.birthdate,
      iban: propsValue.iban,
      bic: propsValue.bic,
      national_identification_number: propsValue.national_identification_number,
      remarks: propsValue.remarks,
      tags: propsValue.tags,
    };

    Object.entries(optionalFields).forEach(([key, value]) => {
      if (value) {
        requestBody[key] = value;
      }
    });
    // Add marketing_mails_consent if it is defined
    if (typeof propsValue.marketing_mails_consent !== 'undefined') {
      requestBody['marketing_mails_consent'] =
        propsValue.marketing_mails_consent;
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/contacts.update',
      requestBody
    );

    return {
      status: 'success',
      message: `Contact ${propsValue.contact_id} updated successfully`,
      data: response,
    };
  },
});
