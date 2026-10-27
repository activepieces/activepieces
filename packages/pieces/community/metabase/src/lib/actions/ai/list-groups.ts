import { createAction } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListGroupsOutputSchema } from '../../output-schemas';

export const listGroupsAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_groups',
  outputSchema: metabaseListGroupsOutputSchema,
  displayName: 'List Groups',
  description: 'List permission groups.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists permission groups with their ids and member counts. Needs an admin key.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const groups = await metabaseApi.listGroups({
      auth,
    });
    return { groups, count: groups.length };
  },
});
