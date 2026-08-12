import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figraniumAuth } from '../auth';
import { figraniumClient } from '../common/client';

export const deleteScheduleAction = createAction({
  auth: figraniumAuth,
  name: 'delete_schedule',
  displayName: 'Delete Schedule',
  description: 'Disable and remove the schedule from a task',
  audience: 'both',
  aiMetadata: {
    description:
      'Disables and removes the schedule from a Figranium task, stopping it from running automatically. The task itself is not deleted. Retrying after success typically errors since the schedule no longer exists.',
    idempotent: false,
  },
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task',
      required: true,
    }),
  },
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
