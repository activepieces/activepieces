import { createPiece } from '../../framework/piece';
import { createQuickCalendarEvent } from './actions/create-quick-event';
import { calendarEventChanged } from './triggers/calendar-event';


export const googleCalendar = createPiece({
	name: 'google_calendar',
	logoUrl: 'https://cdn.activepieces.com/pieces/google_calendar.png',
	displayName: "Google Calendar",
	authors: ['osamahaikal'],
	actions: [createQuickCalendarEvent],
	triggers: [calendarEventChanged],
});
