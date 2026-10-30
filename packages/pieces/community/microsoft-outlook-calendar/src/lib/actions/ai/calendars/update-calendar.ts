import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';

import type { Calendar } from '../../../common/types';
import { outlookCalendarCalendarOutputSchema } from '../../../output-schemas';

export const outlookCalendarUpdateCalendarAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_update_calendar',
  outputSchema: outlookCalendarCalendarOutputSchema,
  displayName: 'Update Calendar',
  description: 'Renames or recolors a calendar, or makes it the default.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes only the fields you set on a calendar (name, color, default flag) and returns the updated calendar. Calendar IDs come from List Calendars or List Calendars in Group. At least one field must be set.',
    idempotent: true,
  },
  props: {
    calendarId: outlookCalendarAiProps.calendarId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New calendar name.',
      required: false,
    }),
    color: outlookCalendarAiProps.calendarColor({ required: false }),
    isDefaultCalendar: Property.StaticDropdown({
      displayName: 'Is Default Calendar',
      description: "Whether this calendar is the user's default calendar.",
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { calendarId, name, color, isDefaultCalendar } = propsValue;
    const body = {
      ...(name !== undefined ? { name } : {}),
      ...(color !== undefined ? { color } : {}),
      ...(isDefaultCalendar !== undefined
        ? { isDefaultCalendar: isDefaultCalendar === 'true' }
        : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one of Name, Color or Is Default Calendar.');
    }
    const response: Calendar = await outlookCalendarClient
      .create({ auth })
      .api(`/me/calendars/${encodeURIComponent(calendarId)}`)
      .patch(body);
    return response;
  },
});
