import { createAction, Property } from '@activepieces/pieces-framework';
import { fathomAuth } from '../common/auth';
import { fathomInputs } from '../common/props';
import { fathomLegacy } from '../common/legacy';
import { fathomOutputSchemas } from '../output-schemas';

export const findTeam = createAction({
  name: 'findTeam',
  classification: 'SEARCH',
  displayName: 'Find Team',
  description: 'List the teams in your Fathom account, one page at a time.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the teams in the connected Fathom account, one page per call; pass the returned cursor to get the next page. Use to get exact team names for the team filters of List Meetings or List Team Members. Read-only and idempotent.',
    idempotent: true,
  },
  auth: fathomAuth,
  props: {
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Cursor for pagination (from previous response)',
      required: false,
    }),
  },
  outputSchema: fathomOutputSchemas.legacyTeams,
  async run({ auth, propsValue }) {
    const cursor = fathomInputs.optionalText({ value: propsValue.cursor });
    return fathomLegacy.listInSdkShape({ auth, path: 'teams', query: { cursor }, fields: ['name'] });
  },
});
