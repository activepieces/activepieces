import { createAction, Property } from '@activepieces/pieces-framework';
import { fathomAuth } from '../common/auth';
import { fathomInputs } from '../common/props';
import { fathomLegacy } from '../common/legacy';
import { fathomOutputSchemas } from '../output-schemas';

export const findTeamMember = createAction({
  name: 'findTeamMember',
  classification: 'SEARCH',
  displayName: 'Find Team Member',
  description: 'List the members of your Fathom account, or of one team.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists members (name, email, join date) of the Fathom account, optionally only those of one team given by exact team name, one page per call with a cursor. Use Find Team Member by Email for a single-person lookup. Read-only and idempotent.',
    idempotent: true,
  },
  auth: fathomAuth,
  props: {
    team: Property.ShortText({
      displayName: 'Team',
      description: 'Exact team name. Empty: every team.',
      placeholder: 'Sales',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: "The next page's cursor from the previous run. Empty: first page.",
      required: false,
      advanced: true,
    }),
  },
  outputSchema: fathomOutputSchemas.legacyTeamMembers,
  async run({ auth, propsValue }) {
    const team = fathomInputs.optionalText({ value: propsValue.team });
    const cursor = fathomInputs.optionalText({ value: propsValue.cursor });
    return fathomLegacy.listInSdkShape({ auth, path: 'team_members', query: { team, cursor }, fields: ['name', 'email'] });
  },
});
