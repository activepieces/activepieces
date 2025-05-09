import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { kommoAuth, getAccessTokenOrThrow, getApiUrl } from '../auth';

export const updateContact = createAction({
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Updates an existing contact in Kommo',
  auth: kommoAuth,
  props: {
    contact_id: Property.Number({
      displayName: 'Contact ID',
      description: 'The ID of the contact to update',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Contact Name',
      description: 'The new name of the contact',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'The new first name of the contact',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'The new last name of the contact',
      required: false,
    }),
    responsible_user_id: Property.Number({
      displayName: 'Responsible User ID',
      description: 'The new ID of the user responsible for the contact',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The new email address of the contact',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'The new phone number of the contact',
      required: false,
    }),
    custom_fields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Custom fields to update for the contact as an array of objects with field_id and values',
      required: false,
    }),
    tags: Property.Object({
      displayName: 'Tags',
      description: 'Tags to update for the contact as an array of objects with name property',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const accessToken = getAccessTokenOrThrow(auth);
    const {
      contact_id,
      name,
      first_name,
      last_name,
      responsible_user_id,
      email,
      phone,
      custom_fields,
      tags,
    } = propsValue;

    // Prepare contact data
    const contactData: Record<string, any> = {
      id: contact_id,
    };

    if (name !== undefined) contactData.name = name;
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

    // Update the contact
    const response = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: getApiUrl(auth, `contacts/${contact_id}`),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: contactData,
    });

    // Get the updated contact with all details
    const updatedContactResponse = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: getApiUrl(auth, `contacts/${contact_id}`),
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return updatedContactResponse.body;
  },
});
