
import { createPiece } from '@activepieces/framework';
import packageJson from '../package.json';
import { everyDayTrigger } from './lib/triggers/every-day.trigger';

export const schedule = createPiece({
  name: 'schedule',
  displayName: 'Schedule',
  logoUrl: 'https://cdn.activepieces.com/pieces/schedule.png',
  description:"All triggers run within UTC+0 timezone",
  version: packageJson.version,
  authors: [
    "abuaboud", "abdulTheActivePiecer"
  ],
  actions: [
  ],
  triggers: [
    everyDayTrigger
  ],
});
