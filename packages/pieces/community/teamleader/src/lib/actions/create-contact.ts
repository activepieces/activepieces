import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  addresses,
  emailTypeDropdown,
  genderDropdown,
  phoneTypeDropdown,
  salutationDropdown,
} from '../common/props';

export const createContact = createAction({
  auth: teamleaderAuth,
  name: 'createContact',
  displayName: 'Create Contact',
  description:
    'Create a new contact person in Teamleader with detailed information',
  props: {
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: "Enter the contact's first name (required)",
      required: true,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: "Enter the contact's last name (required)",
      required: true,
    }),
    salutation: salutationDropdown,
    emails: Property.Array({
      displayName: 'Email Addresses',
      description: 'Add one or more email addresses for the contact',
      required: false,
      properties: {
        type: emailTypeDropdown,
        email: Property.ShortText({
          displayName: 'Email Address',
          description: 'Enter a valid email address',
          required: true,
        }),
      },
    }),
    telephones: Property.Array({
      displayName: 'Phone Numbers',
      description: 'Add one or more phone numbers for the contact',
      required: false,
      properties: {
        type: phoneTypeDropdown,
        number: Property.ShortText({
          displayName: 'Phone Number',
          description:
            'Enter the phone number (including country code if applicable)',
          required: true,
        }),
      },
    }),
    website: Property.ShortText({
      displayName: 'Personal Website',
      description:
        "Enter the contact's personal or business website URL (e.g., https://www.example.com)",
      required: false,
    }),
    language: Property.StaticDropdown({
      displayName: 'Preferred Language',
      description: "Select the contact's preferred language for communication",
      required: false,
      options: {
        options: [
          { label: 'English', value: 'en' },
          { label: 'Dutch', value: 'nl' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Spanish', value: 'es' },
          { label: 'Italian', value: 'it' },
        ],
      },
    }),
    gender: genderDropdown,
    birthdate: Property.DateTime({
      displayName: 'Date of Birth',
      description: "Select the contact's date of birth",
      required: false,
    }),
    addresses: addresses,
    iban: Property.ShortText({
      displayName: 'IBAN',
      description: "Enter the contact's International Bank Account Number",
      required: false,
    }),
    bic: Property.ShortText({
      displayName: 'BIC/SWIFT Code',
      description: 'Enter the Bank Identifier Code (BIC) or SWIFT code',
      required: false,
    }),
    national_identification_number: Property.ShortText({
      displayName: 'National ID Number',
      description:
        "Enter the contact's national identification number (if applicable)",
      required: false,
    }),
    remarks: Property.LongText({
      displayName: 'Internal Notes',
      description: 'Add any internal notes or remarks about this contact',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'Add tags to categorize and organize this contact (e.g., "VIP", "partner")',
      required: false,
      properties: {
        tag: Property.ShortText({
          displayName: 'Tag',
          description: 'Enter a tag name',
          required: true,
        }),
      },
    }),
    marketing_mails_consent: Property.Checkbox({
      displayName: 'Marketing Email Consent',
      description:
        'Check if the contact has given consent to receive marketing emails',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const requestBody: Record<string, unknown> = {
      first_name: propsValue.first_name,
      last_name: propsValue.last_name,
    };

    if (propsValue.salutation)
      requestBody['salutation'] = propsValue.salutation;
    if (propsValue.emails && propsValue.emails.length > 0)
      requestBody['emails'] = propsValue.emails;
    if (propsValue.telephones && propsValue.telephones.length > 0)
      requestBody['telephones'] = propsValue.telephones;
    if (propsValue.website) requestBody['website'] = propsValue.website;
    if (propsValue.language) requestBody['language'] = propsValue.language;
    if (propsValue.gender) requestBody['gender'] = propsValue.gender;
    if (propsValue.birthdate) requestBody['birthdate'] = propsValue.birthdate;
    if (propsValue.iban) requestBody['iban'] = propsValue.iban;
    if (propsValue.bic) requestBody['bic'] = propsValue.bic;
    if (propsValue.national_identification_number) {
      requestBody['national_identification_number'] =
        propsValue.national_identification_number;
    }
    if (propsValue.remarks) requestBody['remarks'] = propsValue.remarks;
    if (typeof propsValue.marketing_mails_consent !== 'undefined') {
      requestBody['marketing_mails_consent'] =
        propsValue.marketing_mails_consent;
    }

    if (propsValue.tags && propsValue.tags.length > 0) {
      requestBody['tags'] = propsValue.tags.map((tag: any) => tag.tag);
    }

    if (propsValue.addresses && propsValue.addresses.length > 0) {
      requestBody['addresses'] = propsValue.addresses.map((addr: any) => ({
        type: addr.type,
        address: {
          ...(addr.addressee && { addressee: addr.addressee }),
          line_1: addr.line_1,
          ...(addr.line_2 && { line_2: addr.line_2 }),
          postal_code: addr.postal_code,
          city: addr.city,
          country: addr.country,
          ...(addr.area_level_two_id && {
            area_level_two_id: addr.area_level_two_id,
          }),
        },
      }));
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      '/contacts.add',
      requestBody
    );

    return {
      status: 'success',
      message: 'Contact created successfully',
      data: response.data,
    };
  },
});
