import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarSuccessOutputSchema } from '../../../output-schemas';

export const outlookCalendarPermanentlyDeleteCalendarAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_permanently_delete_calendar',
  outputSchema: outlookCalendarSuccessOutputSchema,
  displayName: 'Permanently Delete Calendar',
  description: 'Permanently deletes a calendar and its events.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a calendar and every event in it, bypassing Recoverable Items so nothing can be restored; prefer Delete Calendar when recovery may be needed. Calendar IDs come from List Calendars or List Calendars in Group.',
    idempotent: false,
  },
  props: {
    calendarId: outlookCalendarAiProps.calendarId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await outlookCalendarClient
      .create({ auth })
      .api(`/me/calendars/${encodeURIComponent(propsValue.calendarId)}/permanentDelete`)
      .post({});
    return { success: true };
  },
});
