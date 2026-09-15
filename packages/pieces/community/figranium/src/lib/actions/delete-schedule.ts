import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figraniumAuth } from '../auth';
import { figraniumClient } from '../common/client';
import { taskIdDropdown } from '../common/props';

export const deleteScheduleAction = createAction({
  auth: figraniumAuth,
  name: 'delete_schedule',
  displayName: 'Delete Schedule',
  description: 'Disable and remove the schedule from a task',
  audience: 'both',
  aiMetadata: {
    description: 'Disables and removes the schedule from a Figranium task. The task itself is not deleted.',
    idempotent: false,
  },
  props: { taskId: taskIdDropdown },
  async run(context) {
    const { taskId } = context.propsValue;
    return figraniumClient({
      baseUrl: context.auth.props.baseUrl,
      apiKey: context.auth.props.apiKey,
      method: HttpMethod.DELETE,
      resourceUri: `/api/schedules/${encodeURIComponent(taskId)}`,
    });
  },
});
