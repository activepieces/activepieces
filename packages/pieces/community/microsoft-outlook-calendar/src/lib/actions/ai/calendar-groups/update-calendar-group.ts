import { createAction, Property } from '@activepieces/pieces-framework';

import { outlookCalendarAuth } from '../../../auth';
import { outlookCalendarAiProps } from '../../../common/ai-props';
import { outlookCalendarClient } from '../../../common/client';

import type { CalendarGroup } from '../../../common/types';
import { outlookCalendarCalendarGroupOutputSchema } from '../../../output-schemas';

export const outlookCalendarUpdateCalendarGroupAction = createAction({
  auth: outlookCalendarAuth,
  name: 'microsoft_outlook_calendar_update_calendar_group',
  outputSchema: outlookCalendarCalendarGroupOutputSchema,
  displayName: 'Update Calendar Group',
  description: 'Renames a calendar group.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Renames a calendar group, whose ID comes from List Calendar Groups, and returns the updated group. The name is the only writable field.',
    idempotent: true,
  },
  props: {
    calendarGroupId: outlookCalendarAiProps.calendarGroupId({ required: true }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New calendar group name.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response: CalendarGroup = await outlookCalendarClient
      .create({ auth })
      .api(`/me/calendarGroups/${encodeURIComponent(propsValue.calendarGroupId)}`)
      .patch({ name: propsValue.name });
    return response;
  },
});
