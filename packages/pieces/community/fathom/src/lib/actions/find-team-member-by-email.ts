import { createAction, Property } from '@activepieces/pieces-framework';
import { fathomAuth } from '../common/auth';
import { fathomClient } from '../common/client';
import { fathomInputs } from '../common/props';
import { fathomOutputSchemas } from '../output-schemas';

export const findTeamMemberByEmail = createAction({
  name: 'find_team_member_by_email',
  classification: 'READ',
  displayName: 'Find Team Member by Email',
  description: 'Look up one Fathom team member by their exact email address.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up one Fathom team member by exact email (case-insensitive), optionally within a team, and returns their name, email and join date, or found=false. Use to check whether someone is on the Fathom account before filtering meetings by recorder. Read-only and idempotent.',
    idempotent: true,
  },
  auth: fathomAuth,
  props: {
    email: Property.ShortText({ displayName: 'Email', description: 'Email address of the member, e.g. jane@acme.com.', required: true }),
    team: Property.ShortText({ displayName: 'Team', description: 'Optional exact team name to search within.', required: false }),
  },
  outputSchema: fathomOutputSchemas.teamMemberLookup,
  async run({ auth, propsValue }) {
    const email = fathomInputs.optionalText({ value: propsValue.email })?.toLowerCase();
    if (email === undefined || !email.includes('@')) {
      throw new Error('Enter the full email address of the team member, e.g. jane@acme.com.');
    }
    const matches = (items: Record<string, unknown>[]) => items.find((item) => typeof item['email'] === 'string' && item['email'].toLowerCase() === email);
    const result = await fathomClient.listPages({
      auth,
      path: 'team_members',
      query: { team: fathomInputs.optionalText({ value: propsValue.team }) },
      maxPages: MAX_PAGES,
      stopWhen: (items) => matches(items) !== undefined,
    });
    const member = matches(result.items);
    if (member !== undefined) {
      return { found: true, member };
    }
    if (result.truncated) {
      throw new Error(`No member with this email in the first ${MAX_PAGES} pages of team members. Narrow the search with Team.`);
    }
    return { found: false, member: null };
  },
});

const MAX_PAGES = 50;
