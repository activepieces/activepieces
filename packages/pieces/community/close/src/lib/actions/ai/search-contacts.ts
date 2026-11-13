import { createAction, Property } from '@activepieces/pieces-framework';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const CONTACT_FIELDS = ['id', 'lead_id', 'name', 'title', 'emails', 'phones', 'urls', 'custom', 'date_created', 'date_updated'];

const searchContacts = createAction({
  auth: closeAuth,
  name: 'search_contacts',
  classification: 'SEARCH',
  displayName: 'Search Contacts',
  description: 'Find contacts by text and/or lead.',
  audience: 'ai',
  aiMetadata: {
    description: 'Searches Close contacts (people), newest first. Text matches all words (or the exact phrase) across contact names, titles, emails, phones and other text fields. Optionally limit to one lead by lead id (lead_...). Returns up to Limit contacts (max 100); pass nextCursor back as Cursor within 30 seconds for the next page. Read-only.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.contacts,
  props: {
    text: Property.ShortText({ displayName: 'Text', description: 'Words to find, e.g. a name or email.', required: false }),
    exactPhrase: Property.Checkbox({ displayName: 'Exact Phrase', description: 'Match the words in order next to each other.', required: false, defaultValue: false }),
    leadId: Property.ShortText({ displayName: 'Lead ID', description: 'Only contacts of this lead_...', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 100, default 25.', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'nextCursor from the previous page.', required: false }),
  },
  async run({ auth, propsValue }) {
    const text = closeClient.optionalText(propsValue.text);
    const leadId = closeClient.optionalCloseId({ value: propsValue.leadId, label: 'Lead ID', prefix: 'lead' });
    const exact = closeClient.parseBoolean({ value: propsValue.exactPhrase, label: 'Exact Phrase' }) === true;
    const limit = closeClient.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 100 }) ?? 25;
    const queries: Record<string, unknown>[] = [{ type: 'object_type', object_type: 'contact' }];
    if (text !== undefined) queries.push({ type: 'text', value: text, mode: exact ? 'phrase' : 'full_words' });
    if (leadId !== undefined) {
      queries.push({
        type: 'field_condition',
        field: { type: 'regular_field', object_type: 'contact', field_name: 'lead_id' },
        condition: { type: 'reference', reference_type: 'lead', object_ids: [leadId] },
      });
    }
    const page = await closeClient.searchPage({
      auth,
      query: { type: 'and', queries },
      fields: { contact: CONTACT_FIELDS },
      sort: [{ field: { type: 'regular_field', object_type: 'contact', field_name: 'date_created' }, direction: 'desc' }],
      limit,
      cursor: closeClient.optionalText(propsValue.cursor),
    });
    return closeMappers.cursorPage({ ...page, map: closeMappers.contact });
  },
});

export { searchContacts };
