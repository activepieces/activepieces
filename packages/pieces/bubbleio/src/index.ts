import { createPiece } from '@activepieces/framework';
import packageJson from '../package.json';
import { createThing } from './lib/actions/create-thing';

export const bubbleio = createPiece({
  name: 'bubbleio',
  displayName: "Bubble No-Code",
  logoUrl: 'https://seeklogo.com/images/B/bubble-icon-logo-90ECCA2A26-seeklogo.com.png',
  actions: [createThing],
  triggers: [],
  version: packageJson.version,
  authors: ['kanarelo'],
});
