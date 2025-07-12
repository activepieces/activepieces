import { createAction, Property } from '@activepieces/pieces-framework';
import { clicksendAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { countryDropdown, listIdDropdown } from '../common/props';

export const createContact = createAction({
  auth: clicksendAuth,
  name: 'createContact',
  displayName: 'Create Contact',
  description: 'Create a new contact in a ClickSend contact list',
  props: {
    list_id: listIdDropdown,
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'Phone number in E.164 format (e.g., +61411111111). Required if no email or fax number provided.',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description:
        'Email address. Required if no phone number or fax number provided.',
      required: false,
    }),
    fax_number: Property.ShortText({
      displayName: 'Fax Number',
      description: 'Fax number. Required if no phone number or email provided.',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: "Contact's first name",
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: "Contact's last name",
      required: false,
    }),
    organization_name: Property.ShortText({
      displayName: 'Organization Name',
      description: "Contact's organization name",
      required: false,
    }),
    address_line_1: Property.ShortText({
      displayName: 'Address Line 1',
      description: 'Street address line 1',
      required: false,
    }),
    address_line_2: Property.ShortText({
      displayName: 'Address Line 2',
      description: 'Street address line 2',
      required: false,
    }),
    address_city: Property.ShortText({
      displayName: 'City',
      description: 'City name',
      required: false,
    }),
    address_state: Property.ShortText({
      displayName: 'State/Province',
      description: 'State or province',
      required: false,
    }),
    address_postal_code: Property.ShortText({
      displayName: 'Postal Code',
      description: 'Postal/ZIP code',
      required: false,
    }),
    address_country: countryDropdown,
    custom_1: Property.ShortText({
      displayName: 'Custom Field 1',
      description: 'Custom field 1 for additional contact information',
      required: false,
    }),
    custom_2: Property.ShortText({
      displayName: 'Custom Field 2',
      description: 'Custom field 2 for additional contact information',
      required: false,
    }),
    custom_3: Property.ShortText({
      displayName: 'Custom Field 3',
      description: 'Custom field 3 for additional contact information',
      required: false,
    }),
    custom_4: Property.ShortText({
      displayName: 'Custom Field 4',
      description: 'Custom field 4 for additional contact information',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { username, password } = auth;
    const apiKey = `${username}:${password}`;

    // Validate that at least one of phone_number, email, or fax_number is provided
    if (
      !propsValue.phone_number &&
      !propsValue.email &&
      !propsValue.fax_number
    ) {
      throw new Error(
        'At least one of phone_number, email, or fax_number must be provided'
      );
    }

    // Prepare request body with only provided fields
    const requestBody: any = {};

    if (propsValue.phone_number) {
      requestBody.phone_number = propsValue.phone_number;
    }
    if (propsValue.email) {
      requestBody.email = propsValue.email;
    }
    if (propsValue.fax_number) {
      requestBody.fax_number = propsValue.fax_number;
    }
    if (propsValue.first_name) {
      requestBody.first_name = propsValue.first_name;
    }
    if (propsValue.last_name) {
      requestBody.last_name = propsValue.last_name;
    }
    if (propsValue.organization_name) {
      requestBody.organization_name = propsValue.organization_name;
    }
    if (propsValue.address_line_1) {
      requestBody.address_line_1 = propsValue.address_line_1;
    }
    if (propsValue.address_line_2) {
      requestBody.address_line_2 = propsValue.address_line_2;
    }
    if (propsValue.address_city) {
      requestBody.address_city = propsValue.address_city;
    }
    if (propsValue.address_state) {
      requestBody.address_state = propsValue.address_state;
    }
    if (propsValue.address_postal_code) {
      requestBody.address_postal_code = propsValue.address_postal_code;
    }
    if (propsValue.address_country) {
      requestBody.address_country = propsValue.address_country;
    }
    if (propsValue.custom_1) {
      requestBody.custom_1 = propsValue.custom_1;
    }
    if (propsValue.custom_2) {
      requestBody.custom_2 = propsValue.custom_2;
    }
    if (propsValue.custom_3) {
      requestBody.custom_3 = propsValue.custom_3;
    }
    if (propsValue.custom_4) {
      requestBody.custom_4 = propsValue.custom_4;
    }

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      `/lists/${propsValue.list_id}/contacts`,
      undefined,
      requestBody
    );

    return response;
  },
});
