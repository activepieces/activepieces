import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioUpdateCalendarEventOutputSchema } from '../../../output-schemas';

export const updateCalendarEventAction = createAction({
  auth: podioAuth,
  name: 'podio_update_calendar_event',
  outputSchema: podioUpdateCalendarEventOutputSchema,
  displayName: 'Update Calendar Event',
  description: 'Sets a new start and end for a Podio calendar event.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Reschedules one Podio calendar event (a dated item or a task) to a new start and, optionally, end. Dates and times are in the timezone of the connected user; leave the times empty for an all-day event. The event uid comes from Get Global Calendar.',
    idempotent: true,
  },
  props: {
    uid: podioAiProps.id({ required: true, displayName: 'Event UID', description: 'The uid of the event, from Get Global Calendar.' }),
    startDate: podioAiProps.text({ required: true, displayName: 'Start Date', description: 'The new start date, as YYYY-MM-DD.' }),
    startTime: podioAiProps.text({ required: false, displayName: 'Start Time', description: 'The new start time, as HH:MM:SS. Leave empty for an all-day event.' }),
    endDate: podioAiProps.text({ required: false, displayName: 'End Date', description: 'The new end date, as YYYY-MM-DD.' }),
    endTime: podioAiProps.text({ required: false, displayName: 'End Time', description: 'The new end time, as HH:MM:SS. Leave empty for an all-day event.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/calendar/event/${propsValue.uid}`,
      body: podioUtils.body({
        values: {
          start_date: propsValue.startDate,
          start_time: propsValue.startTime,
          end_date: propsValue.endDate,
          end_time: propsValue.endTime,
        },
      }),
    });
  },
});
