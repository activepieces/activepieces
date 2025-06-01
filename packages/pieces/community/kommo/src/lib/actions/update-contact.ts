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
  description: 'Updates an existing contact.',
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
    responsible_user_id: userDropdown(),
    tags_to_add: Property.Array({
      displayName: 'Tags to Add',
      description: 'List of tag names or IDs to add.',
      required: false,
    }),
    tags_to_delete: Property.Array({
      displayName: 'Tags to Delete',
      description: 'List of tag names or IDs to remove.',
      required: false,
    })
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
    } = context.propsValue;

    const tagsToAdd = context.propsValue.tags_to_add ?? [];
    const tagsToDelete = context.propsValue.tags_to_delete ?? [];

    const { subdomain, apiToken } = context.auth;

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

    const updatePayload: Record<string, any> = {
      ...(customFields.length > 0 ? { custom_fields_values: customFields } : {}),
    };

    if (name) updatePayload['name'] = name;
    if (first_name) updatePayload['first_name'] = first_name;
    if (last_name) updatePayload['last_name'] = last_name;
    if (responsible_user_id) updatePayload['responsible_user_id'] = responsible_user_id;

    if (tagsToAdd.length > 0) {
      updatePayload['tags_to_add'] = tagsToAdd.map((tag) => ({ name: tag }))
    }

    if (tagsToDelete.length > 0) {
      updatePayload['tags_to_delete'] = tagsToDelete.map((tag) => ({ name: tag }))
    }

    const result = await makeRequest(
      { subdomain, apiToken },
      HttpMethod.PATCH,
      `/contacts/${contactId}`,
      updatePayload
    );

    return result;
  },
});
