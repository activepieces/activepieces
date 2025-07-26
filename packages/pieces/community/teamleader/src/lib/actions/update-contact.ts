import { createAction, Property } from '@activepieces/pieces-framework';
import { teamleaderAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import {
  contactIdDropdown,
  emailTypeDropdown,
  phoneTypeDropdown,
  genderDropdown,
  salutationDropdown,
  addresses,
} from '../common/props';

export const updateContact = createAction({
  auth: teamleaderAuth,
  name: 'updateContact',
  displayName: 'Update Contact',
  description:
    'Update an existing contact person in Teamleader with new information',
  props: {
    contact_id: contactIdDropdown,

    first_name: Property.ShortText({
      displayName: 'First Name',
      description: "Enter the contact's updated first name",
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: "Enter the contact's updated last name",
      required: false,
    }),
    salutation: salutationDropdown,
    emails: Property.Array({
      displayName: 'Email Addresses',
      description: 'Update or add email addresses for the contact',
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
      description: 'Update or add phone numbers for the contact',
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
      description: 'Add or update internal notes or remarks about this contact',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description:
        'Add or update tags to categorize and organize this contact (e.g., "VIP", "partner")',
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
        'Update consent status for marketing emails (check if contact consents to receive marketing emails)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const requestBody: Record<string, unknown> = {
      id: propsValue.contact_id,
    };

    // Add optional fields only if they have values
    if (propsValue.first_name)
      requestBody['first_name'] = propsValue.first_name;
    if (propsValue.last_name) requestBody['last_name'] = propsValue.last_name;
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

    // Handle marketing consent (boolean can be false, so check if defined)
    if (typeof propsValue.marketing_mails_consent !== 'undefined') {
      requestBody['marketing_mails_consent'] =
        propsValue.marketing_mails_consent;
    }

    // Handle tags array
    if (propsValue.tags && propsValue.tags.length > 0) {
      requestBody['tags'] = propsValue.tags.map((tag: any) => tag.tag);
    }

    // Handle addresses with proper nested structure
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
        },
      }));
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
