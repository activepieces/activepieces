import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const listContacts = createAction({
  auth: ninjapipeAuth,
  name: 'list_contacts',
  classification: 'SEARCH',
  displayName: 'List Contacts',
  description: 'Lists contacts, with optional search, status, owner and assignee filters.',
  audience: 'human',
  aiMetadata: {
    description: 'List NinjaPipe contacts one page at a time, or every page with Return All (capped at 5,000), filtered by search text, status, owner or assignee. Read-only.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.contactList,
  props: {
    search: ninjapipeProps.search(),
    statusFilter: Property.ShortText({ displayName: 'Status', description: 'Only contacts with this status.', required: false }),
    ownerFilter: ninjapipeProps.member({ displayName: 'Owner', description: 'Only contacts owned by this member (owner_id).' }),
    assignedTo: ninjapipeProps.member({ displayName: 'Assigned To', description: 'Only contacts assigned to this member (assigned_to).' }),
    sortBy: ninjapipeProps.staticDropdown({ displayName: 'Sort By', description: 'Field to sort by. Default: created_at.', values: ['created_at', 'updated_at', 'first_name', 'last_name', 'email', 'status'] }),
    sortOrder: ninjapipeProps.staticDropdown({ displayName: 'Sort Order', description: 'Default: desc.', values: ['desc', 'asc'] }),
    limit: ninjapipeProps.limit(),
    page: ninjapipeProps.page(),
    returnAll: ninjapipeProps.returnAll(),
  },
  async run(context) {
    const p = context.propsValue;
    return ninjapipeClient.runList({
      auth: ninjapipeClient.readAuth(context.auth),
      path: '/contacts',
      query: { search: p.search, status: p.statusFilter, owner_id: p.ownerFilter, assigned_to: p.assignedTo, sort_by: p.sortBy, sort_order: p.sortOrder },
      operation: 'list contacts',
      returnAll: p.returnAll,
      page: p.page,
      limit: p.limit,
    });
  },
});
