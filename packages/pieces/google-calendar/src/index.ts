import { createPiece } from '@activepieces/framework';
import { createQuickCalendarEvent } from './lib/actions/create-quick-event';
import { calendarEventChanged } from './lib/triggers/calendar-event';


export const googleCalendar = createPiece({
	name: 'google_calendar',
	logoUrl: 'https://cdn.activepieces.com/pieces/google_calendar.png',
	displayName: "Google Calendar",
  version: '0.0.0',
	authors: ['osamahaikal'],
	actions: [createQuickCalendarEvent],
	triggers: [calendarEventChanged],
});
