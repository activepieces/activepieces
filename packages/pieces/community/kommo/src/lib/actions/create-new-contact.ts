import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { kommoAuth } from '../../index';

export const createContactAction = createAction({
  auth: kommoAuth,
  name: 'create_contact',
  displayName: 'Create New Contact',
  description: 'Add a new contact.',
  props: {
    name: Property.ShortText({
      displayName: 'Contact Name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
  },
  async run(context) {
    const { name, email, phone } = context.propsValue;
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

    const result = await makeRequest(
      { apiToken, subdomain },
      HttpMethod.POST,
      `/contacts`,
      [
        {
          name,
          custom_fields_values: customFields,
        },
      ]
    );

    return result;
  },
});
