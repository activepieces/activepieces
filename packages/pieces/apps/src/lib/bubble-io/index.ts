
import { createPiece } from '@activepieces/framework';
import { createThing } from './actions/create-thing';

export const bubble_io = createPiece({
  name: 'bubble_io',
  displayName: "Bubble No-Code",
  logoUrl: 'https://seeklogo.com/images/B/bubble-icon-logo-90ECCA2A26-seeklogo.com.png',
  actions: [createThing],
  triggers: [],
});
