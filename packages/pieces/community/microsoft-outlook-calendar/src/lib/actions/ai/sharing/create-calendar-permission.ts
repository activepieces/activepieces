import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';
import { outlookCalendarUtils } from '../../../common/utils';

import type { CalendarPermission } from '../../../common/types';
import { outlookCalendarPermissionOutputSchema } from '../../../output-schemas';

export const outlookCalendarCreateCalendarPermissionAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_create_calendar_permission',
  outputSchema: outlookCalendarPermissionOutputSchema,
  displayName: 'Create Calendar Permission',
  description: 'Shares a calendar with someone or makes them a delegate.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Shares the signed-in user's calendar with another person (or makes them a delegate) at the given role, giving them access to its events. Calendar ID comes from List Calendars or Get Calendar; check which roles the person can get with Get Allowed Sharing Roles first. Delegate roles work only for people inside the same organization.",
    idempotent: false,
  },
  props: {
    calendarId: outlookCalendarAiProps.calendarId({ required: true }),
    emailAddress: Property.ShortText({
      displayName: 'Email Address',
      description: 'Email address of the person to share the calendar with.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Display name of the person.',
      required: false,
    }),
    role: outlookCalendarAiProps.calendarRole({ required: true }),
    isInsideOrganization: Property.StaticDropdown({
      displayName: 'Is Inside Organization',
      description: 'Whether the person is in the same organization as the calendar owner.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
    isRemovable: Property.StaticDropdown({
      displayName: 'Is Removable',
      description: "Whether the person can later be removed from the calendar's recipients.",
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { calendarId, emailAddress, name, role, isInsideOrganization, isRemovable } = propsValue;
    outlookCalendarUtils.assertCalendarRole({ role });
    const response: CalendarPermission = await outlookCalendarClient
      .create({ auth })
      .api(`/me/calendars/${encodeURIComponent(calendarId)}/calendarPermissions`)
      .post({
        emailAddress: {
          address: emailAddress,
          ...(name !== undefined ? { name } : {}),
        },
        role,
        ...(isInsideOrganization !== undefined
          ? { isInsideOrganization: isInsideOrganization === 'true' }
          : {}),
        ...(isRemovable !== undefined ? { isRemovable: isRemovable === 'true' } : {}),
      });
    return response;
  },
});
