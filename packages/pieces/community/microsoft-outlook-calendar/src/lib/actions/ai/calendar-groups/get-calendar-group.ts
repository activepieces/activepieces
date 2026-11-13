import { createAction } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';

import type { CalendarGroup } from '../../../common/types';
import { outlookCalendarCalendarGroupOutputSchema } from '../../../output-schemas';

export const outlookCalendarGetCalendarGroupAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_get_calendar_group',
  outputSchema: outlookCalendarCalendarGroupOutputSchema,
  displayName: 'Get Calendar Group',
  description: 'Gets one calendar group.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      "Gets one calendar group's name, class ID and change key by its ID, from List Calendar Groups. Use List Calendars in Group for the calendars it holds.",
    idempotent: true,
  },
  props: {
    calendarGroupId: outlookCalendarAiProps.calendarGroupId({ required: true }),
  },
  async run({ auth, propsValue }) {
    const response: CalendarGroup = await outlookCalendarClient
      .create({ auth })
      .api(`/me/calendarGroups/${encodeURIComponent(propsValue.calendarGroupId)}`)
      .get();
    return response;
  },
});
