import { createAction } from '@activepieces/pieces-framework';
import { googleCalendarAuth } from '../common';
import { findFreeBusyProps, runFindFreeBusy } from './find-busy-free-periods';

export const aiFindBusyPeriods = createAction({
  auth: googleCalendarAuth,
  name: 'google_calendar_find_busy_periods',
  displayName: 'Find Busy Periods',
  description:
    'Return the raw busy time blocks of one or more calendars within a window, via the freebusy query.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Query one or more calendars for their raw busy time blocks within a start/end window, without exposing event details (the low-level freebusy primitive). Use this when you need the busy intervals themselves (e.g. across several shared calendars); to get the inverse open slots directly, use google_calendar_find_free_slots instead. Resolve calendarId values via google_calendar_list_calendars. Requires the calendars to check and a time range. Read-only and idempotent.',
    idempotent: true,
  },
  props: findFreeBusyProps,
  run: runFindFreeBusy,
});
