import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { zoomCreateMeeting } from './lib/actions/create-meeting';
import { zoomCreateMeetingRegistrant } from './lib/actions/create-meeting-registrant';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const zoomAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://zoom.us/oauth/authorize',
  tokenUrl: 'https://zoom.us/oauth/token',
  required: true,
  scope: ['meeting:write:admin', 'meeting:write'],
});

export const zoom = createPiece({
  displayName: 'Zoom',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/zoom.png',
  actions: [
    zoomCreateMeeting,
    zoomCreateMeetingRegistrant,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.zoom.us/v2',
      auth: zoomAuth,
      authMapping: (auth) => {
        const typedAuth = auth as OAuth2PropertyValue;
        return {
          Authorization: `Bearer ${typedAuth.access_token}`,
        };
      },
    }),
  ],
  auth: zoomAuth,
  authors: ['kanarelo'],
  triggers: [],
});
