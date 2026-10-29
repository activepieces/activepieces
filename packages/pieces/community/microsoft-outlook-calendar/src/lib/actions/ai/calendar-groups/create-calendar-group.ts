import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarClient } from '../../../common/client';

import type { CalendarGroup } from '../../../common/types';
import { outlookCalendarCalendarGroupOutputSchema } from '../../../output-schemas';

export const outlookCalendarCreateCalendarGroupAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_create_calendar_group',
  outputSchema: outlookCalendarCalendarGroupOutputSchema,
  displayName: 'Create Calendar Group',
  description: 'Creates a calendar group.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a new, empty calendar group and returns it with its ID; add calendars to it with Create Calendar in Group. Calling it twice creates two groups, so check List Calendar Groups first.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the new calendar group.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response: CalendarGroup = await outlookCalendarClient
      .create({ auth })
      .api('/me/calendarGroups')
      .post({ name: propsValue.name });
    return response;
  },
});
