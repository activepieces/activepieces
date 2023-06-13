import { createPiece } from '@activepieces/pieces-framework';
import { zoomCreateMeeting } from './lib/actions/create-meeting';
import { zoomCreateMeetingRegistrant } from './lib/actions/create-meeting-registrant';

export const zoom = createPiece({
  displayName: "Zoom",
  logoUrl: 'https://cdn.activepieces.com/pieces/zoom.png',
  actions: [zoomCreateMeeting, zoomCreateMeetingRegistrant],
  authors: ['kanarelo'],
  triggers: [],
});
