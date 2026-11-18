import { createAction, Property } from '@activepieces/pieces-framework';
import { reviewflowzAuth } from '../auth';
import { reviewflowzSearch } from '../common/search';

export const findTeamMemberAction = createAction({
  auth: reviewflowzAuth,
  name: 'find_team_member',
  classification: 'SEARCH',
  displayName: 'Find Team Member',
  description: 'Finds a team member by name, to credit them for reviews.',
  audience: 'both',
  aiMetadata: {
    description:
      'Find a Reviewflowz team member (a staff member credited for reviews) by name: an exact match first, else the closest. Returns found: false when none matches. Read-only.',
    idempotent: true,
  },
  props: {
    q: Property.ShortText({ displayName: 'Name', required: true }),
  },
  async run(context) {
    const { auth, propsValue: input } = context;
    const rows = await reviewflowzSearch.list({ auth, path: '/owners', query: { q: input.q, limit: 10 } });
    const exact = rows.filter((row) => reviewflowzSearch.sameName({ row, name: input.q }));
    return reviewflowzSearch.first(exact.length > 0 ? exact : rows);
  },
});
