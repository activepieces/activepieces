import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarUtils } from '../../../common/utils';

import type { CalendarPermission } from '../../../common/types';
import { outlookCalendarPermissionOutputSchema } from '../../../output-schemas';

export const outlookCalendarUpdateCalendarPermissionAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_update_calendar_permission',
  outputSchema: outlookCalendarPermissionOutputSchema,
  displayName: 'Update Calendar Permission',
  description: "Changes a share recipient's or delegate's role on a calendar.",
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the role of an existing share recipient or delegate on a calendar; only the role can change. Calendar ID comes from List Calendars or Get Calendar; Permission ID from List Calendar Permissions, whose allowedRoles lists the roles this person can get.',
    idempotent: true,
  },
  props: {
    calendarId: outlookCalendarAiProps.calendarId({ required: true }),
    permissionId: outlookCalendarAiProps.permissionId({ required: true }),
    role: outlookCalendarAiProps.calendarRole({ required: true }),
  },
  async run({ auth, propsValue }) {
    const { calendarId, permissionId, role } = propsValue;
    outlookCalendarUtils.assertCalendarRole({ role });
    const response: CalendarPermission = await outlookCalendarClient
      .create({ auth })
      .api(
        `/me/calendars/${encodeURIComponent(calendarId)}/calendarPermissions/${encodeURIComponent(
          permissionId,
        )}`,
      )
      .patch({ role });
    return response;
  },
});
