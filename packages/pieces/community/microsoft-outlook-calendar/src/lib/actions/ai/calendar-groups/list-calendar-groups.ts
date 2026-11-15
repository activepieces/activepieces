import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarUtils } from '../../../common/utils';

import type { CalendarGroup, OutlookCalendarPage } from '../../../common/types';
import { outlookCalendarCalendarGroupListOutputSchema } from '../../../output-schemas';

export const outlookCalendarListCalendarGroupsAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_list_calendar_groups',
  outputSchema: outlookCalendarCalendarGroupListOutputSchema,
  displayName: 'List Calendar Groups',
  description: "Lists the signed-in user's calendar groups.",
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Lists the signed-in user's calendar groups with their IDs and names. Use it to find the calendar group ID that List Calendars in Group and Create Calendar in Group take. Returns @odata.nextLink when more pages exist; pass it as Page URL.",
    idempotent: true,
  },
  props: {
    limit: outlookCalendarAiProps.limit({ required: false }),
    pageUrl: outlookCalendarAiProps.pageUrl({ required: false }),
  },
  async run({ auth, propsValue }) {
    const response: OutlookCalendarPage<CalendarGroup> = await outlookCalendarClient
      .list({
        auth,
        path: '/me/calendarGroups',
        query: { $top: outlookCalendarUtils.top({ limit: propsValue.limit }) },
        pageUrl: propsValue.pageUrl,
      })
      .get();
    return response;
  },
});
