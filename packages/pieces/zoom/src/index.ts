import packageJson from '../package.json';
import { createPiece } from '@activepieces/framework';
import { zoomCreateMeeting } from './lib/actions/create-meeting';
import { zoomCreateMeetingRegistrant } from './lib/actions/create-meeting-registrant';

export const zoom = createPiece({
  name: 'zoom',
  displayName: "Zoom",
  logoUrl: 'https://cdn.activepieces.com/pieces/zoom.png',
  version: packageJson.version,
  actions: [zoomCreateMeeting, zoomCreateMeetingRegistrant],
  authors: ['kanarelo'],
  triggers: [],
});
