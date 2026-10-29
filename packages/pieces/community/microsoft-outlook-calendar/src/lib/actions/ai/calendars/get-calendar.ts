import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';

import type { Calendar } from '../../../common/types';
import { outlookCalendarCalendarOutputSchema } from '../../../output-schemas';

export const outlookCalendarGetCalendarAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_get_calendar',
  outputSchema: outlookCalendarCalendarOutputSchema,
  displayName: 'Get Calendar',
  description: 'Gets one calendar, or the default calendar.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Gets one calendar's name, color, owner, edit and share rights and whether it is the default. Leave Calendar ID empty to get the signed-in user's default calendar; calendar IDs come from List Calendars or List Calendars in Group.",
    idempotent: true,
  },
  props: {
    calendarId: outlookCalendarAiProps.calendarId({
      required: false,
      description:
        'Calendar ID, from List Calendars or List Calendars in Group. Leave empty for the default calendar.',
    }),
  },
  async run({ auth, propsValue }) {
    const { calendarId } = propsValue;
    const response: Calendar = await outlookCalendarClient
      .create({ auth })
      .api(calendarId ? `/me/calendars/${encodeURIComponent(calendarId)}` : '/me/calendar')
      .get();
    return response;
  },
});
