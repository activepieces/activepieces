
import { createPiece } from '@activepieces/framework';
import packageJson from '../package.json';
import { cronExpressionTrigger } from './lib/triggers/cron-trigger';

export const schedule = createPiece({
  name: 'schedule',
  displayName: 'Schedule',
  logoUrl: 'https://cdn.activepieces.com/pieces/schedule.png',
  version: packageJson.version,
  authors: [
    "abuaboud", "abdultheactivepiecer"
  ],
  actions: [
  ],
  triggers: [
    cronExpressionTrigger
  ],
});
