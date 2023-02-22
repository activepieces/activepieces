import { createPiece } from '@activepieces/framework';
import { zoomCreateMeeting } from './actions/create-meeting';
import { zoomCreateMeetingRegistrant } from './actions/create-meeting-registrant';

export const zoom = createPiece({
  name: 'zoom',
  displayName: "Zoom",
  logoUrl: 'https://cdn.activepieces.com/pieces/zoom.png',
  version: '0.0.0',
  actions: [zoomCreateMeeting, zoomCreateMeetingRegistrant],
  authors: ['kanarelo'],
  triggers: [],
});
