import { createAction } from '@activepieces/pieces-framework';
import { tarventAuth } from '../auth';
import { tarventCommon } from '../common';
import { tarventOperations } from '../common/operations';
import { tarventOutputSchemas } from '../output-schemas';

export const listContacts = createAction({
  auth: tarventAuth,
  name: 'tarvent_list_contacts',
  classification: 'SEARCH',
  displayName: 'List Contacts',
  description: 'Lists contacts in an audience, optionally only those in one group or segment.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists contacts in a Tarvent audience one page at a time (up to 50 per call), optionally limited to one audience group or segment ID. Returns items plus hasMore and nextCursor; pass nextCursor back as Cursor to get the next page. To fetch one known contact use Find Contact. Read-only.',
    idempotent: true,
  },
  outputSchema: tarventOutputSchemas.contactPage,
  props: {
    audienceId: tarventCommon.audienceId(true, 'Audience to list.'),
    groupId: tarventCommon.audienceGroupId(false, 'Only list contacts in this group.'),
    limit: tarventCommon.limit,
    cursor: tarventCommon.cursor,
  },
  async run(context) {
    return tarventOperations.listContacts({ auth: context.auth.props, audienceId: context.propsValue.audienceId, groupId: context.propsValue.groupId, limit: context.propsValue.limit, cursor: context.propsValue.cursor });
  },
});
