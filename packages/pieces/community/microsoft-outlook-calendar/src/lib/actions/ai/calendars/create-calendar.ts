import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';

import type { Calendar } from '../../../common/types';
import { outlookCalendarCalendarOutputSchema } from '../../../output-schemas';

export const outlookCalendarCreateCalendarAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_create_calendar',
  outputSchema: outlookCalendarCalendarOutputSchema,
  displayName: 'Create Calendar',
  description: 'Creates a calendar in the default calendar group.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      "Creates a new calendar in the signed-in user's default calendar group and returns it with its ID. Use Create Calendar in Group to place it in another group. Calling it twice creates two calendars, so check List Calendars first.",
    idempotent: false,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name of the new calendar.',
      required: true,
    }),
    color: outlookCalendarAiProps.calendarColor({ required: false }),
  },
  async run({ auth, propsValue }) {
    const { name, color } = propsValue;
    const response: Calendar = await outlookCalendarClient
      .create({ auth })
      .api('/me/calendars')
      .post({ name, ...(color !== undefined ? { color } : {}) });
    return response;
  },
});
