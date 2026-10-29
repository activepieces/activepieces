import { createAction, Property } from '@activepieces/pieces-framework';
import { niftyAuth } from '../auth';
import { listMembers as fetchMembers } from '../common';
import { listMembersOutputSchema } from '../output-schemas';

export const listMembers = createAction({
  auth: niftyAuth,
  name: 'list_members',
  displayName: 'List Members',
  description: 'List the members of your Nifty workspace.',
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the members of the Nifty workspace with their member ID, name, email and role; removed members are left out unless asked for. Use to get the member IDs that assignee options need. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    include_removed: Property.Checkbox({ displayName: 'Include Removed Members', required: false, defaultValue: false }),
  },
  outputSchema: listMembersOutputSchema,
  async run(context) {
    const items = await fetchMembers({ auth: context.auth, includeRemoved: context.propsValue.include_removed === true });
    return { items };
  },
});
