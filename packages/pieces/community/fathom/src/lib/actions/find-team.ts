import { fathomAuth, getFathomClient } from '../common/auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ListTeamsRequest } from 'fathom-typescript/dist/esm/sdk/models/operations';

export const findTeam = createAction({
  name: 'findTeam',
  displayName: 'Find Team',
  description: 'Find team based on name',
  auth: fathomAuth,
  props: {
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Cursor for pagination (from previous response)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const fathom = getFathomClient(auth);

    const params: Partial<ListTeamsRequest> = {};
    if (propsValue.cursor) {
      params.cursor = propsValue.cursor;
    }

    const response = await fathom.listTeams(params);

    return response;
  },
});
