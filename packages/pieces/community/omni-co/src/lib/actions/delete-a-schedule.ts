import { createAction, Property } from '@activepieces/pieces-framework';
import { omniAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { scheduleIdDropdown } from '../common/props';

export const deleteASchedule = createAction({
  auth: omniAuth,
  name: 'deleteASchedule',
  displayName: 'Delete a schedule',
  description: 'Deletes a schedule using its UUID',
  props: {
    scheduleId: scheduleIdDropdown,
  },
  async run(context) {
    const { scheduleId } = context.propsValue;

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.DELETE,
      `/schedules/${scheduleId}`,
      {}
    );

    return response;
  },
});
