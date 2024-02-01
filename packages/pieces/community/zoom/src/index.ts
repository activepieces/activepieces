import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
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
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/zoom.png',
  actions: [zoomCreateMeeting, zoomCreateMeetingRegistrant],
  categories: [PieceCategory.COMMUNICATION],
  auth: zoomAuth,
  authors: ['kanarelo'],
  triggers: [],
});
