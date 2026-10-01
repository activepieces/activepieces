import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../../common/auth';
import { SystemeContact, systemeIoCommon, systemeIoInput } from '../../common/client';
import { optionalLocale } from '../../common/dropdowns';
import { aiCreateContactOutputSchema } from '../../output-schemas-ai';
import { aiCommon } from './common';

export const systemeCreateContact = createAction({
  auth: systemeIoAuth,
  name: 'systeme_create_contact',
  classification: 'WRITE',
  displayName: 'Create Contact (AI)',
  description: 'Create a contact with fields and existing tag ids',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new Systeme.io contact from an email, with optional locale, contact field values (slugs from systeme_list_contact_fields) and existing tag ids (from systeme_list_tags or create_tag). Use to add a new lead; check first with find_contacts when the email may already exist, since a duplicate email fails with a validation error. Not idempotent: each successful call creates a contact. Tag failures are reported per tag instead of failing the call.',
    idempotent: false,
  },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The contact email address, e.g. "jane@example.com".',
      required: true,
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: "Optional two-letter language code: en, fr, es, it, pt, de, nl, ru, jp, tr, ar, zh, sv, ro, cs, hu, sk, dk, id, pl, el, sr, hi, no, th, sq, sl or ua.",
      required: false,
    }),
    fields: Property.Array({
      displayName: 'Fields',
      description: 'Optional field values, e.g. [{"slug":"first_name","value":"Jane"},{"slug":"country","value":"US"}]. Country takes a 2-letter ISO code.',
      required: false,
      properties: {
        slug: Property.ShortText({ displayName: 'Slug', required: true }),
        value: Property.ShortText({ displayName: 'Value', required: false }),
      },
    }),
    tag_ids: Property.Array({
      displayName: 'Tag IDs',
      description: 'Optional numeric ids of existing tags to assign, e.g. ["123","456"].',
      required: false,
    }),
  },
  outputSchema: aiCreateContactOutputSchema,
  async run(context) {
    const p = context.propsValue;
    const apiKey = context.auth.secret_text;
    const email = p.email.trim();
    if (email === '') {
      throw new Error('email is required.');
    }
    const locale = optionalLocale(p.locale);
    const fields = aiCommon.fieldsInput({ value: p.fields }).filter((field) => field.value !== null);
    const tagIds = systemeIoInput.idList({ value: p.tag_ids, name: 'tag_ids' });

    const contact = await systemeIoCommon.apiCall<SystemeContact>({
      method: HttpMethod.POST,
      url: '/contacts',
      auth: apiKey,
      body: {
        email,
        ...(locale !== undefined ? { locale } : {}),
        ...(fields.length > 0 ? { fields } : {}),
      },
    });

    const tagResults = [];
    for (const tagId of tagIds) {
      try {
        await systemeIoCommon.apiCall({
          method: HttpMethod.POST,
          url: `/contacts/${contact.id}/tags`,
          auth: apiKey,
          body: { tagId },
        });
        tagResults.push({ tag_id: tagId, assigned: true, error: null });
      } catch (error) {
        tagResults.push({ tag_id: tagId, assigned: false, error: error instanceof Error ? error.message : String(error) });
      }
    }

    const assigned = tagResults.some((r) => r.assigned);
    const refreshed = assigned
      ? await systemeIoCommon.getContact({ contactId: contact.id, auth: apiKey }).catch(() => undefined)
      : undefined;

    return {
      contact_id: contact.id,
      email: contact.email,
      contact: refreshed ?? contact,
      tag_results: tagResults,
      tags_assigned: tagResults.filter((r) => r.assigned).length,
      tags_failed: tagResults.filter((r) => !r.assigned).length,
    };
  },
});
