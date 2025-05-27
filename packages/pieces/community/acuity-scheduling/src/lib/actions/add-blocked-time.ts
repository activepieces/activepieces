import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAcuityRequest } from '../common';
import { acuityAuth } from '../../index';
import { fetchCalendars } from '../common';

export const addBlockedTime = createAction({
  name: 'add_blocked_time',
  displayName: 'Add Blocked Off Time',
  description: 'Block off time on your calendar.',
  auth: acuityAuth,
  props: {
    start: Property.ShortText({
      displayName: 'Start Time',
      required: true,
      description: 'Start date and time to block off (must be parsable by strtotime)',
    }),
    end: Property.ShortText({
      displayName: 'End Time',
      required: true,
      description: 'End date and time of blocked off time (must be parsable by strtotime)',
    }),
    calendarID: Property.Dropdown({
      displayName: 'Calendar',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        const calendars = await fetchCalendars(auth as { userId: string; apiKey: string });
        return calendars.map((calendar: any) => ({
          label: calendar.name,
          value: calendar.id,
        }));
      },
      description: 'Select the calendar to add this blocked time to.',
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
      description: 'Any notes to include for the blocked off time',
    }),
  },
  async run(context) {
    const body = {
      start: context.propsValue.start,
      end: context.propsValue.end,
      calendarID: context.propsValue.calendarID,
      notes: context.propsValue.notes,
    };

    return await makeAcuityRequest(
      context.auth,
      HttpMethod.POST,
      '/blocks',
      body
    );
  },
});