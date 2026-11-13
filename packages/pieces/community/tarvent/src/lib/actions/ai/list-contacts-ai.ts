import { createAction, Property } from '@activepieces/pieces-framework';
import { tarventAuth } from '../../auth';
import { tarventOperations } from '../../common/operations';
import { tarventOutputSchemas } from '../../output-schemas';

export const listContactsAi = createAction({
  auth: tarventAuth,
  name: 'tarvent_list_contacts_ai',
  classification: 'SEARCH',
  displayName: 'List Contacts (AI)',
  description: 'Lists contacts in an audience one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists contacts in a Tarvent audience, optionally only one group or segment ID, up to 50 per call. Returns items, hasMore and nextCursor; pass nextCursor as cursor for the next page. Read-only.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.contactPage,
  props: {
    audienceId: Property.ShortText({ displayName: 'Audience ID', description: 'The Tarvent audience ID (from Find Audience).', required: true }),
    groupId: Property.ShortText({ displayName: 'Group ID', description: 'Only contacts in this group or segment.', required: false }),
    limit: Property.Number({ displayName: 'Limit', description: 'Results per page, 1-50 (default 50).', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'nextCursor from the previous page.', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    return tarventOperations.listContacts({ auth: context.auth.props, audienceId: p.audienceId, groupId: p.groupId, limit: p.limit, cursor: p.cursor });
  },
});
