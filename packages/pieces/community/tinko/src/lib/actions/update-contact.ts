import { createAction, Property } from '@activepieces/pieces-framework';
import { tinkoAuth } from '../auth';
import { tinkoContact } from '../common/contact';
import { tinkoOutput } from '../common/output';
import { tinkoProps } from '../common/props';

export const updateContactAction = createAction({
  auth: tinkoAuth,
  name: 'update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact',
  description: 'Updates the name, tags, blocked status or custom fields of a contact.',
  audience: 'both',
  aiMetadata: {
    description:
      'Update an existing Tinko contact by ID. Only the fields you fill in change; custom fields are merged with the current values, while Tags replaces the whole tag set (use Add Tag to Contact to append). The phone number cannot change. Safe to retry with the same values.',
    idempotent: true,
  },
  props: {
    contactId: tinkoContact.contactId(),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New full name of the contact, for example Jane Smith. Leave empty to keep the current name.',
      required: false,
    }),
    tags: tinkoProps.tagsMultiSelect({
      description:
        'Replaces all tags currently on the contact. Leave empty to keep the current tags. To add tags without removing the others, use Add Tag to Contact.',
    }),
    blocked: Property.StaticDropdown({
      displayName: 'Blocked',
      description: 'Block or unblock the contact. Leave empty to keep the current status.',
      required: false,
      options: {
        options: [
          { label: 'Yes, block the contact', value: 'yes' },
          { label: 'No, unblock the contact', value: 'no' },
        ],
      },
    }),
    customFields: tinkoProps.customFields({
      description:
        'New values for custom contact fields. Only the fields you fill in change; the other values stay as they are.',
    }),
  },
  async run(context) {
    const { contactId, name, tags, blocked, customFields } = context.propsValue;
    const token = context.auth.secret_text;
    const id = contactId.trim();
    const filledFields = await tinkoContact.resolveCustomFields({ token, values: customFields });
    const hasCustomFields = Object.keys(filledFields).length > 0;
    const mergedCustomFields = hasCustomFields
      ? {
          ...tinkoContact.currentCustomFields(await tinkoContact.get({ token, id })),
          ...filledFields,
        }
      : undefined;
    const body: Record<string, unknown> = {
      ...(name ? { name } : {}),
      ...(blocked ? { blocked: blocked === 'yes' } : {}),
      ...(tags && tags.length > 0 ? { tags } : {}),
      ...(mergedCustomFields ? { customfields: mergedCustomFields } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Fill in at least one field to update.');
    }
    const updated = await tinkoContact.update({ token, id, body });
    return tinkoOutput.contact(updated);
  },
});
