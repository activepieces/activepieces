import { fathomAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Fathom } from 'fathom-typescript';
import { ListTeamMembersRequest } from 'fathom-typescript/dist/esm/sdk/models/operations';

export const findTeamMember = createAction({
  name: 'findTeamMember',
  displayName: 'Find Team Member',
  description: 'Find team member based on email',
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
    const fathom = new Fathom({
      security: { apiKeyAuth: auth.secret_text }
    });

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
