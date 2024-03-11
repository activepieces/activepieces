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
  description: '',
  authUrl: 'https://zoom.us/oauth/authorize',
  tokenUrl: 'https://zoom.us/oauth/token',
  required: true,
  scope: ['meeting:write:admin', 'meeting:write'],
});

export const zoom = createPiece({
  displayName: 'Zoom',
  description: 'Video conferencing, web conferencing, webinars, screen sharing',

  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/zoom.png',
  categories: [PieceCategory.COMMUNICATION],
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
  authors: ["kanarelo","kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  triggers: [],
});
