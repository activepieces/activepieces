import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarUtils } from '../../../common/utils';

import type { CalendarPermission, OutlookCalendarPage } from '../../../common/types';
import { outlookCalendarPermissionListOutputSchema } from '../../../output-schemas';

export const outlookCalendarListCalendarPermissionsAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_list_calendar_permissions',
  outputSchema: outlookCalendarPermissionListOutputSchema,
  displayName: 'List Calendar Permissions',
  description: 'Lists who a calendar is shared with or delegated to.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Lists the share recipients and delegates of a calendar, each with its permission ID, email address and role. Use it to find the permission ID that Get, Update and Delete Calendar Permission take; Calendar ID comes from List Calendars or Get Calendar. Returns @odata.nextLink when more pages exist; pass it as Page URL.',
    idempotent: true,
  },
  props: {
    calendarId: outlookCalendarAiProps.calendarId({ required: true }),
    limit: outlookCalendarAiProps.limit({ required: false }),
    pageUrl: outlookCalendarAiProps.pageUrl({ required: false }),
  },
  async run({ auth, propsValue }) {
    const response: OutlookCalendarPage<CalendarPermission> = await outlookCalendarClient
      .list({
        auth,
        path: `/me/calendars/${encodeURIComponent(propsValue.calendarId)}/calendarPermissions`,
        query: { $top: outlookCalendarUtils.top({ limit: propsValue.limit }) },
        pageUrl: propsValue.pageUrl,
      })
      .get();
    return response;
  },
});
