import { createAction } from '@activepieces/pieces-framework';
import { tinkoAuth } from '../auth';
import { tinkoContact } from '../common/contact';
import { tinkoOutput } from '../common/output';
import { tinkoProps } from '../common/props';

export const addTagToContactAction = createAction({
  auth: tinkoAuth,
  name: 'add_tag_to_contact',
  classification: 'WRITE',
  displayName: 'Add Tag to Contact',
  description: 'Adds one or more tags to a contact and keeps the tags it already has.',
  audience: 'both',
  aiMetadata: {
    description:
      'Add tags to an existing Tinko contact by ID without removing its current tags. Use Create Tag first if the tag does not exist yet, and Update Contact to replace the whole tag set instead. Safe to retry, since adding a tag the contact already has changes nothing.',
    idempotent: true,
  },
  props: {
    contactId: tinkoContact.contactId(),
    tags: tinkoProps.tagsMultiSelect({
      description: 'The tags to add to the contact.',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.secret_text;
    const id = context.propsValue.contactId.trim();
    const contact = await tinkoContact.get({ token, id });
    const currentTagIds = (contact.tags ?? []).map((tag) => tag.id);
    const tagIds = [...new Set([...currentTagIds, ...(context.propsValue.tags ?? [])])];
    if (tagIds.length === currentTagIds.length) {
      return tinkoOutput.contact(contact);
    }
    const updated = await tinkoContact.update({ token, id, body: { tags: tagIds } });
    return tinkoOutput.contact(updated);
  },
});
