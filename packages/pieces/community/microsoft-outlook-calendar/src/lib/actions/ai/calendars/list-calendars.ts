import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarUtils } from '../../../common/utils';

import type { Calendar, OutlookCalendarPage } from '../../../common/types';
import { outlookCalendarCalendarListOutputSchema } from '../../../output-schemas';

export const outlookCalendarListCalendarsAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_list_calendars',
  outputSchema: outlookCalendarCalendarListOutputSchema,
  displayName: 'List Calendars',
  description: "Lists the signed-in user's calendars.",
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Lists every calendar in the signed-in user's mailbox, across all calendar groups, with its ID, name, color, owner and edit rights. Use it to find the calendar ID other actions take; List Calendars in Group narrows to one group. Returns @odata.nextLink when more pages exist; pass it as Page URL.",
    idempotent: true,
  },
  props: {
    limit: outlookCalendarAiProps.limit({ required: false }),
    pageUrl: outlookCalendarAiProps.pageUrl({ required: false }),
  },
  async run({ auth, propsValue }) {
    const response: OutlookCalendarPage<Calendar> = await outlookCalendarClient
      .list({
        auth,
        path: '/me/calendars',
        query: { $top: outlookCalendarUtils.top({ limit: propsValue.limit }) },
        pageUrl: propsValue.pageUrl,
      })
      .get();
    return response;
  },
});
