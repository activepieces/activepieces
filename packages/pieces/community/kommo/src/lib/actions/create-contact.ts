import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { kommoAuth, getAccessTokenOrThrow, getApiUrl } from '../auth';

export const createContact = createAction({
  name: 'create_contact',
  displayName: 'Create New Contact',
  description: 'Creates a new contact in Kommo',
  auth: kommoAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Contact Name',
      description: 'The name of the contact',
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
    responsible_user_id: Property.Number({
      displayName: 'Responsible User ID',
      description: 'The ID of the user responsible for the contact',
      required: false,
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
    custom_fields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Custom fields for the contact as an array of objects with field_id and values',
      required: false,
    }),
    tags: Property.Object({
      displayName: 'Tags',
      description: 'Tags for the contact as an array of objects with name property',
      required: false,
    }),
    company_id: Property.Number({
      displayName: 'Company ID',
      description: 'The ID of the company to link to this contact',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const accessToken = getAccessTokenOrThrow(auth);
    const {
      name,
      first_name,
      last_name,
      responsible_user_id,
      email,
      phone,
      custom_fields,
      tags,
      company_id,
    } = propsValue;

    // Prepare contact data
    const contactData: Record<string, any> = {
      name,
    };

    if (first_name !== undefined) contactData.first_name = first_name;
    if (last_name !== undefined) contactData.last_name = last_name;
    if (responsible_user_id !== undefined) contactData.responsible_user_id = responsible_user_id;

    // Prepare custom fields array
    const customFieldsValues = [];

    // Add email if provided
    if (email) {
      customFieldsValues.push({
        field_code: 'EMAIL',
        values: [{ value: email }],
      });
    }

    // Add phone if provided
    if (phone) {
      customFieldsValues.push({
        field_code: 'PHONE',
        values: [{ value: phone }],
      });
    }

    // Add other custom fields if provided
    if (custom_fields && typeof custom_fields === 'object') {
      // Assuming custom_fields is an array in the JSON input
      const fieldsArray = Array.isArray(custom_fields) ? custom_fields : [custom_fields];
      customFieldsValues.push(...fieldsArray);
    }

    if (customFieldsValues.length > 0) {
      contactData.custom_fields_values = customFieldsValues;
    }

    // Add tags if provided
    if (tags && typeof tags === 'object') {
      contactData._embedded = {
        tags: tags,
      };
    }

    // Create the contact
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: getApiUrl(auth, 'contacts'),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: [contactData],
    });

    // If a company ID is provided, link it to the contact
    const createdContact = response.body?._embedded?.contacts?.[0];

    if (createdContact && company_id) {
      const contactId = createdContact.id;

      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: getApiUrl(auth, 'contacts/link'),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: {
          to_entity_id: contactId,
          to_entity_type: 'contacts',
          from_entity_id: company_id,
          from_entity_type: 'companies',
        },
      });

      // Get the updated contact with linked entities
      const updatedContactResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: getApiUrl(auth, `contacts/${contactId}`),
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return updatedContactResponse.body;
    }

    return response.body;
  },
});
