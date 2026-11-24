import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarSuccessOutputSchema } from '../../../output-schemas';

export const outlookCalendarDeleteCalendarAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_delete_calendar',
  outputSchema: outlookCalendarSuccessOutputSchema,
  displayName: 'Delete Calendar',
  description: 'Deletes a calendar and its events.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      "Deletes a calendar and every event in it; the items move to Recoverable Items, while Permanently Delete Calendar purges them. The default calendar can't be deleted. Calendar IDs come from List Calendars or List Calendars in Group.",
    idempotent: false,
  },
  props: {
    calendarId: outlookCalendarAiProps.calendarId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await outlookCalendarClient
      .create({ auth })
      .api(`/me/calendars/${encodeURIComponent(propsValue.calendarId)}`)
      .delete();
    return { success: true };
  },
});
