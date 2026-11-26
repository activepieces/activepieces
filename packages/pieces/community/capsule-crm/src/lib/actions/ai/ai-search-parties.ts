import { createAction, Property } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { partyPageOutputSchema } from '../../common/output-schemas';

export const aiSearchParties = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_search_parties',
  classification: 'SEARCH',
  displayName: 'Search Contacts',
  description: 'Searches people and organisations.',
  audience: 'ai',
  aiMetadata: {
    description: 'Searches Capsule CRM parties (people and organisations) by free text such as a name, email or phone, one page at a time. Leave Query empty to list all parties. Results include both people and organisations; each item has type (person or organisation), so filter by type yourself if you need only one kind. Use the returned id as Party ID in other tools. Read-only.',
    idempotent: true,
  },
  outputSchema: partyPageOutputSchema,
  props: {
    query: Property.ShortText({ displayName: 'Query', description: 'Free text to match against names, emails, phone numbers and more. Leave empty to list all.', required: false }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1. Defaults to 1.', required: false }),
    per_page: Property.Number({ displayName: 'Per Page', description: 'Results per page, 1-100. Defaults to 50.', required: false }),
  },
  async run({ auth, propsValue }) {
    const paging = capsuleCrmClient.pageArgs({ page: propsValue.page, perPage: propsValue.per_page });
    const result = await capsuleCrmClient.searchPartiesPage({ auth, searchTerm: propsValue.query, ...paging });
    return { parties: result.items, page: paging.page, hasMore: result.hasMore };
  },
});
