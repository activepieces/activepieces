import { fathomAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Fathom } from 'fathom-typescript';
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
    const fathom = new Fathom({
      security: { apiKeyAuth: auth.secret_text },
    });

    const params: Partial<ListTeamsRequest> = {};
    if (propsValue.cursor) {
      params.cursor = propsValue.cursor;
    }

    const response = await fathom.listTeams(params);

    return response;
  },
});
