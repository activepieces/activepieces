import { createPiece } from '@activepieces/pieces-framework';
import { createQuickCalendarEvent } from './lib/actions/create-quick-event';
import { calendarEventChanged } from './lib/triggers/calendar-event';
import { createEvent } from "./lib/actions/create-event";


export const googleCalendar = createPiece({
  logoUrl: 'https://cdn.activepieces.com/pieces/google-calendar.png',
  displayName: 'Google Calendar',
  authors: ['osamahaikal', 'bibhuty-did-this'],
  actions: [createQuickCalendarEvent, createEvent],
  triggers: [calendarEventChanged],
});
