import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { emailTypeDropdown, genderDropdown } from '../common/props';

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
    email: Property.Array({
      displayName: 'Emails',
      description: 'Email addresses for the company',
      required: false,
      properties: {
        type: emailTypeDropdown,
        email: Property.ShortText({
          displayName: 'Email Address',
          description: 'The email address',
          required: true,
        }),
      },
    }),
    salutation: Property.ShortText({
      displayName: 'Salutation',
      description: 'The salutation for the contact (e.g., Mr., Ms.)',
      required: false,
    }),
    telephones: Property.Array({
      displayName: 'Phone Numbers',
      description: 'Phone numbers for the company',
      required: false,
      properties: {
        type: emailTypeDropdown,
        number: Property.ShortText({
          displayName: 'Phone Number',
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
    remarks: Property.LongText({
      displayName: 'Remarks',
      description: 'Additional remarks about the contact',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to categorize the contact',
      required: false,
    }),
    marketing_mails_consent: Property.Checkbox({
      displayName: 'Marketing Mails Consent',
      description: 'Consent for sending marketing emails',
      required: false,
    }),
  },
  async run(context) {
    const requestBody = {
      first_name: context.propsValue.firstName,
      last_name: context.propsValue.lastName,
      emails: context.propsValue.email,
      telephones: context.propsValue.telephones,
      website: context.propsValue.website,
      language: context.propsValue.language,
      gender: context.propsValue.gender,
      birthdate: context.propsValue.birthdate,
      iban: context.propsValue.iban,
      bic: context.propsValue.bic,
      remarks: context.propsValue.remarks,
      tags: context.propsValue.tags,
      marketing_mails_consent: context.propsValue.marketing_mails_consent,
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
