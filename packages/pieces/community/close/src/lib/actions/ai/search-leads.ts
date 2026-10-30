import { createAction, Property } from '@activepieces/pieces-framework';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';
import { closeOutputSchemas } from '../../common/output-schemas';

const LEAD_FIELDS = ['id', 'display_name', 'name', 'description', 'url', 'status_id', 'status_label', 'contacts', 'opportunities', 'addresses', 'custom', 'created_by', 'date_created', 'date_updated'];

const searchLeads = createAction({
  auth: closeAuth,
  name: 'search_leads',
  classification: 'SEARCH',
  displayName: 'Search Leads',
  description: 'Find leads by text and/or status.',
  audience: 'ai',
  aiMetadata: {
    description: 'Searches Close leads, newest first. Text matches all words (or the exact phrase) across lead names, contacts, emails, phones and other text fields. Optionally filter by a stat_ lead status id from List Lead Statuses. Returns up to Limit leads (max 100) with contacts; pass nextCursor back as Cursor within 30 seconds for the next page. Read-only.',
    idempotent: true,
  },
  outputSchema: closeOutputSchemas.leads,
  props: {
    text: Property.ShortText({ displayName: 'Text', description: 'Words to find, e.g. company name or email.', required: false }),
    exactPhrase: Property.Checkbox({ displayName: 'Exact Phrase', description: 'Match the words in order next to each other.', required: false, defaultValue: false }),
    statusId: Property.ShortText({ displayName: 'Lead Status ID', description: 'stat_... from List Lead Statuses.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: '1 to 100, default 25.', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'nextCursor from the previous page.', required: false }),
  },
  async run({ auth, propsValue }) {
    const text = closeClient.optionalText(propsValue.text);
    const statusId = closeClient.optionalCloseId({ value: propsValue.statusId, label: 'Lead Status ID', prefix: 'stat' });
    const exact = closeClient.parseBoolean({ value: propsValue.exactPhrase, label: 'Exact Phrase' }) === true;
    const limit = closeClient.parseInteger({ value: propsValue.limit, label: 'Limit', min: 1, max: 100 }) ?? 25;
    const queries: Record<string, unknown>[] = [{ type: 'object_type', object_type: 'lead' }];
    if (text !== undefined) queries.push({ type: 'text', value: text, mode: exact ? 'phrase' : 'full_words' });
    if (statusId !== undefined) {
      queries.push({
        type: 'field_condition',
        field: { type: 'regular_field', object_type: 'lead', field_name: 'status_id' },
        condition: { type: 'reference', reference_type: 'status.lead', object_ids: [statusId] },
      });
    }
    const page = await closeClient.searchPage({
      auth,
      query: { type: 'and', queries },
      fields: { lead: LEAD_FIELDS },
      sort: [{ field: { type: 'regular_field', object_type: 'lead', field_name: 'date_created' }, direction: 'desc' }],
      limit,
      cursor: closeClient.optionalText(propsValue.cursor),
    });
    return closeMappers.cursorPage({ ...page, map: closeMappers.lead });
  },
});

export { searchLeads };
