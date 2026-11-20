import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { kommoAuth } from '../auth';
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
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Updates an existing contact.',
  audience: 'both',
  aiMetadata: { description: 'Updates an existing Kommo CRM contact identified by contact ID, changing only the supplied fields (name, email/phone, responsible user) and adding or removing tags. Use to amend a known contact; resolve the contact ID first via Find Contact if unknown. Idempotent — repeating the same update yields the same contact state, though tag add/delete depends on the current tag set.', idempotent: true },
  propertyGroups: [
    {
      key: 'contact',
      display: 'section',
      label: 'Contact to Update',
      icon: 'user',
      props: ['contactId', 'changes_info'],
    },
    {
      key: 'name',
      display: 'section',
      label: 'Name',
      icon: 'type',
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
      props: ['tags_to_add', 'tags_to_delete'],
    },
  ],
  props: {
    contactId: contactDropdown,
    changes_info: Property.MarkDown({
      value: 'Fields left empty keep their current value.',
      variant: MarkdownVariant.INFO,
    }),
    name: Property.ShortText({
      displayName: 'Full Name',
      placeholder: 'Jane Doe',
      required: false,
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
      description: "Replaces the contact's current email.",
      placeholder: 'jane@example.com',
      required: false,
      width: 'half',
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: "Replaces the contact's current phone number.",
      placeholder: '+1 555 123 4567',
      required: false,
      width: 'half',
    }),
    responsible_user_id: userDropdown(),
    tags_to_add: Property.Array({
      displayName: 'Tags to Add',
      description: 'Tag names to add to the contact.',
      required: false,
    }),
    tags_to_delete: Property.Array({
      displayName: 'Tags to Remove',
      description: 'Tag names to remove from the contact.',
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

    const { subdomain, apiToken } = context.auth.props;

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
