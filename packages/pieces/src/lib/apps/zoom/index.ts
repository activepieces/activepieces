import { createPiece } from '../../framework/piece';
import { zoomCreateMeetingRegistrant } from './actions/create-meeting-registrant';

export const zoom = createPiece({
  name: 'zoom',
  displayName: "Zoom",
  logoUrl: 'https://explore.zoom.us/media/logo-zoom-blue.svg',
  actions: [zoomCreateMeetingRegistrant],
  triggers: [],
});
