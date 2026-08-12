import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figraniumAuth } from '../auth';
import { figraniumClient } from '../common/client';

export const getScheduleStatusAction = createAction({
  auth: figraniumAuth,
  name: 'get_schedule_status',
  displayName: 'Get Schedule Status',
  description: 'Get the schedule status and next run time for a specific task',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets the schedule status and next run time for a single Figranium task by ID. Use this to check whether a specific task is scheduled and when it will next run. Safe to retry.',
    idempotent: true,
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
      method: HttpMethod.GET,
      resourceUri: `/api/schedules/${encodeURIComponent(taskId)}/status`,
    });
  },
});
