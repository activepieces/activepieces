import { createAction, Property } from '@activepieces/pieces-framework';
import { metabaseAiProps } from '../../ai-props';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseListUsersOutputSchema } from '../../output-schemas';

export const listUsersAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_list_users',
  outputSchema: metabaseListUsersOutputSchema,
  displayName: 'List Users',
  description: 'List Metabase users.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists users with their ids, emails and status, one page at a time, optionally matching a name or email or limited to one group. Needs an admin key to see other users.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Text',
      description: 'Match against name or email. Empty = all users.',
      required: false,
    }),
    groupId: metabaseAiProps.groupId({
      required: false,
      description:
        'Only members of this group, from List Groups. Empty = all groups.',
    }),
    includeDeactivated: Property.Checkbox({
      displayName: 'Include Deactivated',
      description: 'Also return deactivated users.',
      required: false,
      defaultValue: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of items to return. Defaults to 50.',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of items to skip, for the next page. Defaults to 0.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const limit = propsValue.limit ?? 50;
    if (limit < 1) {
      throw new Error('Limit must be at least 1.');
    }
    return await metabaseApi.listUsers({
      auth,
      query: propsValue.query,
      groupId: propsValue.groupId,
      includeDeactivated: propsValue.includeDeactivated ?? false,
      limit,
      offset: propsValue.offset,
    });
  },
});
