import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';

import type { Calendar } from '../../../common/types';
import { outlookCalendarCalendarOutputSchema } from '../../../output-schemas';

export const outlookCalendarCreateCalendarInGroupAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_create_calendar_in_group',
  outputSchema: outlookCalendarCalendarOutputSchema,
  displayName: 'Create Calendar in Group',
  description: 'Creates a calendar in a calendar group.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new calendar inside the given calendar group, whose ID comes from List Calendar Groups, and returns it with its ID. Use Create Calendar for the default group. Calling it twice creates two calendars, so check List Calendars in Group first.',
    idempotent: false,
  },
  props: {
    calendarGroupId: outlookCalendarAiProps.calendarGroupId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the new calendar.',
      required: true,
    }),
    color: outlookCalendarAiProps.calendarColor({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { calendarGroupId, name, color } = propsValue;
    const response: Calendar = await outlookCalendarClient
      .create({ auth })
      .api(`/me/calendarGroups/${encodeURIComponent(calendarGroupId)}/calendars`)
      .post({ name, ...(color !== undefined ? { color } : {}) });
    return response;
  },
});
