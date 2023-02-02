import { createPiece } from '../../framework/piece';
import { zoomCreateMeeting } from './actions/create-meeting';

export const zoom = createPiece({
  name: 'zoom',
  displayName: "Zoom",
  logoUrl: 'https://explore.zoom.us/media/logo-zoom-blue.svg',
  actions: [zoomCreateMeeting],
  triggers: [],
});
