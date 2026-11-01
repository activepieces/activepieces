import { createAction } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../../auth';
import { ninjapipeAiProps } from '../../common/ai-props';
import { ninjapipeClient } from '../../common/client';
import { ninjapipeSchemas } from '../../output-schemas';

export const aiSearchContacts = createAction({
  auth: ninjapipeAuth,
  name: 'ai_search_contacts',
  classification: 'SEARCH',
  displayName: 'Search Contacts',
  description: 'Searches contacts page by page.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Search NinjaPipe contacts by free text (name, email, phone) and filter by status, owner_id or assigned_to. Returns one page: items, total, hasMore and nextPage (pass it as page to continue). Use it to find a contact_id before get, update, note or delete steps. Read-only.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.contactList,
  props: {
    search: ninjapipeAiProps.text({ displayName: 'Search', description: 'Free text matched against name, email and phone. Not an exact match: check the email of each result.' }),
    status: ninjapipeAiProps.text({ displayName: 'Status', description: 'Only contacts with this status, e.g. Active or Lead.' }),
    owner_id: ninjapipeAiProps.optionalId({ displayName: 'Owner ID', description: 'Only contacts owned by a workspace member account_id from ai_list_workspace_members.' }),
    assigned_to: ninjapipeAiProps.optionalId({ displayName: 'Assigned To', description: 'Only contacts assigned to a workspace member account_id from ai_list_workspace_members.' }),
    sort_by: ninjapipeAiProps.sortBy({ values: ['created_at', 'updated_at', 'first_name', 'last_name', 'email'] }),
    sort_order: ninjapipeAiProps.sortOrder(),
    page: ninjapipeAiProps.page(),
    limit: ninjapipeAiProps.limit(),
  },
  async run(context) {
    const p = context.propsValue;
    return ninjapipeClient.listPage({
      auth: ninjapipeClient.readAuth(context.auth),
      path: '/contacts',
      query: { search: p.search, status: p.status, owner_id: p.owner_id, assigned_to: p.assigned_to, sort_by: p.sort_by, sort_order: p.sort_order },
      page: ninjapipeClient.readPage(p.page),
      limit: ninjapipeClient.clampLimit({ value: p.limit }),
      operation: 'search contacts',
    });
  },
});
