import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';

import type { CalendarRoleType, OutlookCalendarPage } from '../../../common/types';
import { outlookCalendarAllowedRolesOutputSchema } from '../../../output-schemas';

export const outlookCalendarGetAllowedSharingRolesAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_get_allowed_sharing_roles',
  outputSchema: outlookCalendarAllowedRolesOutputSchema,
  displayName: 'Get Allowed Sharing Roles',
  description: 'Lists the roles a calendar can be shared with a person at.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Lists the permission roles a calendar can be shared with or delegated to the given person at, before calling Create Calendar Permission. Calendar ID comes from List Calendars or Get Calendar.',
    idempotent: true,
  },
  props: {
    calendarId: outlookCalendarAiProps.calendarId({ required: true }),
    user: Property.ShortText({
      displayName: 'User Email',
      description: 'Email address of the person to check.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const user = encodeURIComponent(propsValue.user.replace(/'/g, "''"));
    const response: OutlookCalendarPage<CalendarRoleType> = await outlookCalendarClient
      .create({ auth })
      .api(
        `/me/calendars/${encodeURIComponent(
          propsValue.calendarId,
        )}/allowedCalendarSharingRoles(User='${user}')`,
      )
      .get();
    return response;
  },
});
