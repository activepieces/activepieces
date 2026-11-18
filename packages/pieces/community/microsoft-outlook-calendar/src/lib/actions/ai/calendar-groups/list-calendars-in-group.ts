import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarUtils } from '../../../common/utils';

import type { Calendar, OutlookCalendarPage } from '../../../common/types';
import { outlookCalendarCalendarListOutputSchema } from '../../../output-schemas';

export const outlookCalendarListCalendarsInGroupAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_list_calendars_in_group',
  outputSchema: outlookCalendarCalendarListOutputSchema,
  displayName: 'List Calendars in Group',
  description: 'Lists the calendars in one calendar group.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Lists the calendars in one calendar group, with ID, name, color, owner and edit rights; the group ID comes from List Calendar Groups. Use List Calendars for every calendar across groups. Returns @odata.nextLink when more pages exist; pass it as Page URL.',
    idempotent: true,
  },
  props: {
    calendarGroupId: outlookCalendarAiProps.calendarGroupId({ required: true }),
    limit: outlookCalendarAiProps.limit({ required: false }),
    pageUrl: outlookCalendarAiProps.pageUrl({ required: false }),
  },
  async run({ auth, propsValue }) {
    const response: OutlookCalendarPage<Calendar> = await outlookCalendarClient
      .list({
        auth,
        path: `/me/calendarGroups/${encodeURIComponent(propsValue.calendarGroupId)}/calendars`,
        query: { $top: outlookCalendarUtils.top({ limit: propsValue.limit }) },
        pageUrl: propsValue.pageUrl,
      })
      .get();
    return response;
  },
});
