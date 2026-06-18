import { fathomAuth, getFathomClient } from '../common/auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ListTeamMembersRequest } from 'fathom-typescript/dist/esm/sdk/models/operations';

export const findTeamMember = createAction({
  name: 'findTeamMember',
  displayName: 'Find Team Member',
  description: 'Find team member based on email',
  audience: 'both',
  aiMetadata: { description: 'List team members in the connected Fathom workspace, optionally narrowed to a single team by name; with no team supplied it returns members across all teams. Use to look up who belongs to a team. Read-only and repeatable; use the cursor for pagination.', idempotent: true },
  auth: fathomAuth,
  props: {
    team: Property.ShortText({
      displayName: 'Team',
      description: 'Team name to filter by',
      required: false
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Cursor for pagination (from previous response)',
      required: false
    })
  },
  async run({ auth, propsValue }) {
    const fathom = getFathomClient(auth);

    const params: Partial<ListTeamMembersRequest> = {};

    if (propsValue.team) {
      params.team = propsValue.team;
    }

    if (propsValue.cursor) {
      params.cursor = propsValue.cursor;
    }

    const response = await fathom.listTeamMembers(params);

    return response;
  }
});
