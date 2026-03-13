import { PieceAuth } from '@activepieces/pieces-framework';

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
