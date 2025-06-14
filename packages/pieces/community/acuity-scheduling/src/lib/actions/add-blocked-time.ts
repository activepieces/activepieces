import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAcuityRequest } from '../common';
import { acuityAuth } from '../../index';
import { calendarIdDropdown } from '../common/props';

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
    calendarID: calendarIdDropdown,
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