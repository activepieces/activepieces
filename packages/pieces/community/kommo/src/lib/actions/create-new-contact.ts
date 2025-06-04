import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { kommoAuth } from '../../index';
import { userDropdown } from '../common/props';

interface KommoCustomFieldValue {
  field_id?: number;
  field_code?: string;
  values: Array<{ value: string | number; enum_id?: number }>;
}

export const createContactAction = createAction({
  auth: kommoAuth,
  name: 'create_contact',
  displayName: 'Create New Contact',
  description: 'Add a new contact.',
  props: {
    name: Property.ShortText({
      displayName: 'Full Name',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    responsible_user_id: userDropdown(),
    tags_to_add: Property.Array({
      displayName: 'Tags to Add',
      required: false,
    })
  },
  async run(context) {
    const {
      name,
      first_name,
      last_name,
      email,
      phone,
      responsible_user_id,
    } = context.propsValue;
    const tagsToAdd = context.propsValue.tags_to_add ?? [];


    const { subdomain, apiToken } = context.auth as {
      subdomain: string;
      apiToken: string;
    };

    const customFields: KommoCustomFieldValue[] = [];

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


    const contactPayload: Record<string, any> = {
      ...(customFields.length > 0 ? { custom_fields_values: customFields } : {}),
    };


    if (name) contactPayload['name'] = name;
    if (first_name) contactPayload['first_name'] = first_name;
    if (last_name) contactPayload['last_name'] = last_name;
    if (responsible_user_id) contactPayload['responsible_user_id'] = responsible_user_id;


    if (tagsToAdd.length > 0) {
      contactPayload['tags_to_add'] = tagsToAdd.map((tag) => ({ name: tag }))
    }

    const result = await makeRequest(
      { apiToken, subdomain },
      HttpMethod.POST,
      `/contacts`,
      [contactPayload]
    );

    return result;
  },
});
