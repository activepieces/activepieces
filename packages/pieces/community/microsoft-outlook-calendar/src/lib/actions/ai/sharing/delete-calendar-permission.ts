import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarSuccessOutputSchema } from '../../../output-schemas';

export const outlookCalendarDeleteCalendarPermissionAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_delete_calendar_permission',
  outputSchema: outlookCalendarSuccessOutputSchema,
  displayName: 'Delete Calendar Permission',
  description: 'Stops sharing a calendar with someone or removes a delegate.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      "Removes a share recipient or delegate from a calendar, revoking their access at once; it can't be undone except by sharing again with Create Calendar Permission. Calendar ID comes from List Calendars or Get Calendar; Permission ID from List Calendar Permissions (permissions with isRemovable false, such as My Organization, can't be removed).",
    idempotent: false,
  },
  props: {
    calendarId: outlookCalendarAiProps.calendarId({ required: true }),
    permissionId: outlookCalendarAiProps.permissionId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await outlookCalendarClient
      .create({ auth })
      .api(
        `/me/calendars/${encodeURIComponent(
          propsValue.calendarId,
        )}/calendarPermissions/${encodeURIComponent(propsValue.permissionId)}`,
      )
      .delete();
    return { success: true };
  },
});
