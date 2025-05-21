import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { kommoAuth } from '../../index';

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
    responsible_user_id: Property.Number({
      displayName: 'Responsible User ID',
      required: false,
    }),
    created_by: Property.Number({
      displayName: 'Created By',
      required: false,
    }),
    updated_by: Property.Number({
      displayName: 'Updated By',
      required: false,
    }),
    created_at: Property.Number({
      displayName: 'Created At (Unix Timestamp)',
      required: false,
    }),
    updated_at: Property.Number({
      displayName: 'Updated At (Unix Timestamp)',
      required: false,
    }),
    custom_fields_values: Property.Json({
      displayName: 'Custom Fields Values',
      description: 'Additional custom fields (array format).',
      required: false,
    }),
    tags_to_add: Property.Array({
      displayName: 'Tags to Add',
      description: 'List of tag names or IDs to add.',
      required: false,
    }),
    tags_to_delete: Property.Array({
      displayName: 'Tags to Delete',
      description: 'List of tag names or IDs to remove.',
      required: false,
    }),
  },
  async run(context) {
    const {
      name,
      first_name,
      last_name,
      email,
      phone,
      responsible_user_id,
      created_by,
      updated_by,
      created_at,
      updated_at,
      custom_fields_values,
      tags_to_add,
      tags_to_delete,
    } = context.propsValue;

    const { subdomain, apiToken } = context.auth as {
      subdomain: string;
      apiToken: string;
    };

    const customFields: KommoCustomFieldValue[] = [];

    if (Array.isArray(custom_fields_values)) {
      customFields.push(...(custom_fields_values as KommoCustomFieldValue[]));
    }

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

    const embedded: Record<string, unknown> = {};

    if (tags_to_add && tags_to_add.length > 0) {
      embedded['tags_to_add'] = tags_to_add.map((tag) => {
        return typeof tag === 'number' ? { id: tag } : { name: tag };
      });
    }

    if (tags_to_delete && tags_to_delete.length > 0) {
      embedded['tags_to_delete'] = tags_to_delete.map((tag) => {
        return typeof tag === 'number' ? { id: tag } : { name: tag };
      });
    }

    const contactPayload = {
      name,
      first_name,
      last_name,
      responsible_user_id,
      created_by,
      updated_by,
      created_at,
      updated_at,
      ...(customFields.length > 0 ? { custom_fields_values: customFields } : {}),
      _embedded: Object.keys(embedded).length > 0 ? embedded : undefined,
    };

    const result = await makeRequest(
      { apiToken, subdomain },
      HttpMethod.POST,
      `/contacts`,
      [contactPayload]
    );

    return result;
  },
});
