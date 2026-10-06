import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../../common/auth';
import { apiErrorStatus, systemeIoCommon, systemeIoInput } from '../../common/client';
import { systemeOps } from '../../common/operations';
import { aiAddTagOutputSchema } from '../../output-schemas-ai';

export const systemeAddTagToContact = createAction({
  auth: systemeIoAuth,
  name: 'systeme_add_tag_to_contact',
  classification: 'WRITE',
  displayName: 'Add Tag to Contact (AI)',
  description: 'Assign an existing tag to a contact by id',
  audience: 'ai',
  aiMetadata: {
    description:
      'Assigns an existing Systeme.io tag to a contact, both given by numeric id; tagging often starts automations in systeme.io. Get the tag id from systeme_list_tags or create_tag (which also creates a missing tag). Idempotent: assigning a tag the contact already has succeeds again and changes nothing.',
    idempotent: true,
  },
  props: {
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'Numeric contact id, e.g. "12345".',
      required: true,
    }),
    tag_id: Property.ShortText({
      displayName: 'Tag ID',
      description: 'Numeric tag id, e.g. "678" (from systeme_list_tags).',
      required: true,
    }),
  },
  outputSchema: aiAddTagOutputSchema,
  async run(context) {
    const apiKey = context.auth.secret_text;
    const contactId = systemeIoInput.requireId({ value: context.propsValue.contact_id, name: 'contact_id' });
    const tagId = systemeIoInput.requireId({ value: context.propsValue.tag_id, name: 'tag_id' });
    try {
      await systemeIoCommon.apiCall({
        method: HttpMethod.POST,
        url: `/contacts/${contactId}/tags`,
        auth: apiKey,
        body: { tagId },
      });
      return { assigned: true, already_assigned: false, contact_id: contactId, tag_id: tagId };
    } catch (error) {
      const onContact = apiErrorStatus(error) === 422 && (await systemeOps.tagIsOnContact({ apiKey, contactId, tagId }).catch(() => false));
      if (onContact) {
        return { assigned: true, already_assigned: true, contact_id: contactId, tag_id: tagId };
      }
      throw error;
    }
  },
});
