
import { createPiece } from '@activepieces/framework';
import packageJson from '../package.json';
import { sendEmail } from './lib/actions/send-email';

export const smtp = createPiece({
  name: 'smtp',
  displayName: 'smtp',
  logoUrl: 'https://www.logolynx.com/images/logolynx/1f/1f9a438eaaf4f20885ecd763723479e7.png',
  version: packageJson.version,
  authors: [
  ],
  actions: [
    sendEmail,
  ],
  triggers: [
  ],
});
