import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { kommoAuth } from '../auth';
import { userDropdown } from '../common/props';

interface KommoCustomFieldValue {
  field_id?: number;
  field_code?: string;
  values: Array<{ value: string | number; enum_id?: number }>;
}

export const createContactAction = createAction({
  auth: kommoAuth,
  name: 'create_contact',
  classification: 'WRITE',
  displayName: 'Create New Contact',
  description: 'Creates a new contact.',
  audience: 'both',
  aiMetadata: { description: 'Creates a new contact in a Kommo CRM account with name, optional email/phone (stored as custom fields), responsible user, and tags. Use when adding a person not already in the CRM; consider finding the contact first to avoid duplicates. Not idempotent — each call creates a separate contact even with identical input.', idempotent: false },
  propertyGroups: [
    {
      key: 'name',
      display: 'section',
      label: 'Name',
      icon: 'user',
      props: ['name', 'first_name', 'last_name'],
    },
    {
      key: 'details',
      display: 'section',
      label: 'Details',
      icon: 'inbox',
      props: ['email', 'phone', 'responsible_user_id'],
    },
    {
      key: 'tags',
      display: 'section',
      label: 'Tags',
      icon: 'tag',
      props: ['tags_to_add'],
    },
  ],
  props: {
    name: Property.ShortText({
      displayName: 'Full Name',
      placeholder: 'Jane Doe',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      placeholder: 'Jane',
      required: false,
      width: 'half',
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      placeholder: 'Doe',
      required: false,
      width: 'half',
    }),
    email: Property.ShortText({
      displayName: 'Email',
      placeholder: 'jane@example.com',
      required: false,
      width: 'half',
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      placeholder: '+1 555 123 4567',
      required: false,
      width: 'half',
    }),
    responsible_user_id: userDropdown(),
    tags_to_add: Property.Array({
      displayName: 'Tags to Add',
      description: 'Tag names to add to the contact.',
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


    const { subdomain, apiToken } = context.auth.props

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
