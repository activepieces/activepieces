import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { zoomCreateMeeting } from './lib/actions/create-meeting';
import { zoomCreateMeetingRegistrant } from './lib/actions/create-meeting-registrant';

export const zoomAuth = PieceAuth.OAuth2({
  description: `
  1. Go to [marketplace.zoom.us](https://marketplace.zoom.us/) and log in to your account.
  2. In the upper-right corner, click **Develop** then **Build App**.
  3. Select **General App**.
  4. Copy the Client ID and Client Secret.Add Redirect URL and press continue.
  5. Go to **Scopes** from left side bar and add **meeting:write:meeting** and **meeting:write:registrant** as scopes.`,
  authUrl: 'https://zoom.us/oauth/authorize',
  tokenUrl: 'https://zoom.us/oauth/token',
  required: true,
  // scope: ['meeting:write:admin', 'meeting:write'],
  scope: [],
});

export const zoom = createPiece({
  displayName: 'Zoom',
  description: 'Video conferencing, web conferencing, webinars, screen sharing',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/zoom.png',
  categories: [PieceCategory.COMMUNICATION],
  actions: [
    zoomCreateMeeting,
    zoomCreateMeetingRegistrant,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.zoom.us/v2',
      auth: zoomAuth,
      authMapping: async (auth) => {
        const typedAuth = auth as OAuth2PropertyValue;
        return {
          Authorization: `Bearer ${typedAuth.access_token}`,
        };
      },
    }),
  ],
  auth: zoomAuth,
  authors: ['kanarelo', 'kishanprmr', 'MoShizzle', 'khaledmashaly', 'abuaboud'],
  triggers: [],
});
