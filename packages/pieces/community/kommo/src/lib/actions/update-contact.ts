import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { kommoAuth } from '../../index';
import { makeRequest } from '../common';
import { contactDropdown, userDropdown } from '../common/props';

interface KommoCustomFieldValue {
  field_id?: number;
  field_code?: string;
  values: Array<{ value: string | number; enum_id?: number }>;
}

export const updateContactAction = createAction({
  auth: kommoAuth,
  name: 'update_contact',
  displayName: 'Update Contact',
  description: 'Update existing contact info.',
  props: {
    contactId: contactDropdown,
    name: Property.ShortText({
      displayName: 'Full Name',
      required: false,
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
    responsible_user_id: userDropdown,
    created_by: userDropdown,
    updated_by: userDropdown,
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
    request_id: Property.ShortText({
      displayName: 'Request ID',
      description: 'Optional request ID to be echoed in the response.',
      required: false,
    }),
  },
  async run(context) {
    const {
      contactId,
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
      request_id,
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

    if (tags_to_add?.length) {
      embedded['tags_to_add'] = tags_to_add.map((tag) =>
        typeof tag === 'number' ? { id: tag } : { name: tag }
      );
    }

    if (tags_to_delete?.length) {
      embedded['tags_to_delete'] = tags_to_delete.map((tag) =>
        typeof tag === 'number' ? { id: tag } : { name: tag }
      );
    }

    if (request_id) {
      embedded['request_id'] = request_id;
    }

    const updatePayload = {
      name,
      first_name,
      last_name,
      responsible_user_id,
      created_by,
      updated_by,
      created_at,
      updated_at,
      ...(customFields.length > 0 ? { custom_fields_values: customFields } : {}),
      ...(Object.keys(embedded).length > 0 ? { _embedded: embedded } : {}),
    };

    const result = await makeRequest(
      { subdomain, apiToken },
      HttpMethod.PATCH,
      `/contacts/${contactId}`,
      updatePayload
    );

    return result;
  },
});
