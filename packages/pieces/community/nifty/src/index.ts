import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  OAuth2PropertyValue,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createTask } from './lib/actions/create-task';

const mddescription = `
# How to add a new connection
1. Login to your nifty account at https://niftypm.com/
2. From your account settings, click on App Center
3. After that click on Integrate with API
4. Then Create a new app
5. Select the Name and Description you want
6. copy the redirect url from the piece and fill the url field ( without https:// )
7. check out Milestones , Subtasks , Projects , Statuses , Tasks and Portfolios
8. copy the client id and client secret and paste them in the piece
`;

export const niftyAuth = PieceAuth.OAuth2({
  authUrl: 'https://nifty.pm/authorize',
  tokenUrl: 'https://openapi.niftypm.com/oauth/token',
  required: true,
  description: mddescription,
  scope: ['task', 'project', 'subtask', 'milestone', 'subteam'],
});

export const nifty = createPiece({
  displayName: 'Nifty',
  description: 'Project management made simple',

  auth: niftyAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/nifty.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ["kishanprmr","MoShizzle","abuaboud"],
  actions: [
    createTask,
    createCustomApiCallAction({
      baseUrl: () => 'https://openapi.niftypm.com/api/v1.0',
      auth: niftyAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});
