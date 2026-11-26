import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { entryPageOutputSchema } from '../../common/output-schemas';

export const aiListEntries = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_list_entries',
  classification: 'READ',
  displayName: 'List History',
  description: 'Lists notes, emails and other history entries of a record.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists the history entries (notes, emails, completed tasks) of one Capsule CRM party, opportunity or project, one page at a time (max 50 per page). Read-only.',
    idempotent: true,
  },
  outputSchema: entryPageOutputSchema,
  props: {
    entity_type: Property.StaticDropdown({ displayName: 'Record Type', description: 'Type of record whose history to list.', required: true, options: { options: [ { label: 'Party (person or organisation)', value: 'party' }, { label: 'Opportunity', value: 'opportunity' }, { label: 'Project', value: 'project' } ] } }),
    entity_id: Property.ShortText({ displayName: 'Record ID', description: 'Numeric ID of the party, opportunity or project.', required: true }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1. Defaults to 1.', required: false }),
    per_page: Property.Number({ displayName: 'Per Page', description: 'Results per page, 1-50. Defaults to 50.', required: false }),
  },
  async run({ auth, propsValue }) {
    const entity = propsValue.entity_type;
    if (entity !== 'party' && entity !== 'opportunity' && entity !== 'project') {
      throw new Error('Record Type must be party, opportunity or project.');
    }
    const paging = capsuleCrmClient.pageArgs({ page: propsValue.page, perPage: propsValue.per_page, max: 50 });
    const result = await capsuleCrmClient.listEntriesPage({ auth, entity, entityId: propsValue.entity_id, ...paging });
    return { entries: result.items, page: paging.page, hasMore: result.hasMore };
  },
});
