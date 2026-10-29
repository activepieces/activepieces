import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../../common/auth';
import { SystemeContact, systemeIoCommon, systemeIoInput } from '../../common/client';
import { optionalLocale } from '../../common/dropdowns';
import { aiUpdateContactOutputSchema } from '../../output-schemas-ai';
import { aiCommon } from './common';

export const systemeUpdateContact = createAction({
  auth: systemeIoAuth,
  name: 'systeme_update_contact',
  classification: 'WRITE',
  displayName: 'Update Contact (AI)',
  description: "Change a contact's field values or locale",
  audience: 'ai',
  aiMetadata: {
    description:
      "Partially updates a Systeme.io contact: only the field slugs you pass change, every other field is left as it is, and a field with an empty or null value is cleared. Optionally changes the locale. Use to correct or enrich a known contact (slugs from systeme_list_contact_fields); the email cannot be changed. Idempotent: sending the same values again converges on the same contact.",
    idempotent: true,
  },
  props: {
    contact_id: Property.ShortText({
      displayName: 'Contact ID',
      description: 'Numeric contact id, e.g. "12345".',
      required: true,
    }),
    fields: Property.Array({
      displayName: 'Fields',
      description: 'Field values to set, e.g. [{"slug":"phone_number","value":"+15551234"}]. Use {"slug":"phone_number","value":null} to clear a field. Slugs you leave out are not touched.',
      required: false,
      properties: {
        slug: Property.ShortText({ displayName: 'Slug', required: true }),
        value: Property.ShortText({ displayName: 'Value', required: false }),
      },
    }),
    locale: Property.ShortText({
      displayName: 'Locale',
      description: 'Optional new two-letter language code (en, fr, es, de, jp, dk, ua, ...). Omit to keep the current one.',
      required: false,
    }),
  },
  outputSchema: aiUpdateContactOutputSchema,
  async run(context) {
    const p = context.propsValue;
    const contactId = systemeIoInput.requireId({ value: p.contact_id, name: 'contact_id' });
    const fields = aiCommon.fieldsInput({ value: p.fields });
    const locale = optionalLocale(p.locale);
    if (fields.length === 0 && locale === undefined) {
      throw new Error('Nothing to update: pass at least one field or a locale.');
    }
    const contact = await systemeIoCommon.apiCall<SystemeContact>({
      method: HttpMethod.PATCH,
      url: `/contacts/${contactId}`,
      auth: context.auth.secret_text,
      headers: { 'Content-Type': 'application/merge-patch+json' },
      body: {
        ...(fields.length > 0 ? { fields } : {}),
        ...(locale !== undefined ? { locale } : {}),
      },
    });
    return {
      contact_id: contactId,
      updated_slugs: fields.filter((f) => f.value !== null).map((f) => f.slug),
      cleared_slugs: fields.filter((f) => f.value === null).map((f) => f.slug),
      locale_changed: locale !== undefined,
      contact,
    };
  },
});
