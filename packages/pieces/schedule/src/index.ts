
import { createPiece } from '@activepieces/framework';
import packageJson from '../package.json';
import { cronExpressionTrigger } from './lib/triggers/cron-expression.trigger';
import { everyDayTrigger } from './lib/triggers/every-day.trigger';
import { everyHourTrigger } from './lib/triggers/every-hour.trigger';
import { everyMonthTrigger } from './lib/triggers/every-month.trigger';
import { everyWeekTrigger } from './lib/triggers/every-week.trigger';

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
    everyHourTrigger,
    everyDayTrigger,
    everyWeekTrigger,
    everyMonthTrigger,
    cronExpressionTrigger
  ],
});
