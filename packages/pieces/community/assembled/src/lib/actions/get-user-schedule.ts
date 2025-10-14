import { createAction, Property } from '@activepieces/pieces-framework';
import { assembledCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const getUserSchedule = createAction({
  name: 'get_user_schedule',
  displayName: 'Get User Schedule',
  description: 'Retrieves user\'s schedule for specified period.',
  props: {
    user_id: Property.ShortText({
      displayName: 'User ID',
      required: true,
    }),
    start_date: Property.DateTime({
      displayName: 'Start Date',
      required: true,
    }),
    end_date: Property.DateTime({
      displayName: 'End Date',
      required: true,
    }),
  },
  async run(context) {
    const { user_id, start_date, end_date } = context.propsValue;
    
    const params = new URLSearchParams({
      start_date: assembledCommon.formatDate(start_date),
      end_date: assembledCommon.formatDate(end_date),
    });

    const response = await assembledCommon.makeRequest(
      context.auth as string,
      HttpMethod.GET,
      `/users/${user_id}/schedule?${params.toString()}`
    );

    return response.body;
  },
});