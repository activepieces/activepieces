import { createAction, Property } from '@activepieces/pieces-framework';
import { kommoAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateContactAction = createAction({
  auth: kommoAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Update existing contact info.',
  props: {
    contactId: Property.ShortText({
      displayName: 'Contact ID',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'New Email',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'New Phone',
      required: false,
    }),
  },
  async run(context) {
    const { contactId, name, email, phone } = context.propsValue;
    const { subdomain, apiToken } = context.auth as {
      subdomain: string;
      apiToken: string;
    };

    const customFields = [];

    if (email) {
      customFields.push({
        field_code: 'EMAIL',
        values: [{ value: email }],
      });
    }

    if (phone) {
      customFields.push({
        field_code: 'PHONE',
        values: [{ value: phone }],
      });
    }

    const updateData: Record<string, unknown> = { name };

    if (customFields.length > 0) {
      updateData['custom_fields_values'] = customFields;
    }

    const result = await makeRequest(
      { apiToken, subdomain },
      HttpMethod.PATCH,
      `/contacts/${contactId}`,
      updateData
    );

    return result;
  },
});
