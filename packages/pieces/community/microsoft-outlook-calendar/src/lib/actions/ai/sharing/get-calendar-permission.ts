import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';

import type { CalendarPermission } from '../../../common/types';
import { outlookCalendarPermissionOutputSchema } from '../../../output-schemas';

export const outlookCalendarGetCalendarPermissionAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_get_calendar_permission',
  outputSchema: outlookCalendarPermissionOutputSchema,
  displayName: 'Get Calendar Permission',
  description: 'Gets one share recipient or delegate of a calendar.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one permission on a calendar: the recipient or delegate, their role, the roles they could be given and whether they can be removed. Calendar ID comes from List Calendars or Get Calendar; Permission ID from List Calendar Permissions.',
    idempotent: true,
  },
  props: {
    calendarId: outlookCalendarAiProps.calendarId({ required: true }),
    permissionId: outlookCalendarAiProps.permissionId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const response: CalendarPermission = await outlookCalendarClient
      .create({ auth })
      .api(
        `/me/calendars/${encodeURIComponent(
          propsValue.calendarId,
        )}/calendarPermissions/${encodeURIComponent(propsValue.permissionId)}`,
      )
      .get();
    return response;
  },
});
