import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figraniumAuth } from '../auth';
import { figraniumClient } from '../common/client';
import { taskIdDropdown } from '../common/props';

export const getScheduleStatusAction = createAction({
  auth: figraniumAuth,
  name: 'get_schedule_status',
  displayName: 'Get Schedule Status',
  description: 'Return schedule status and next run time for a single task',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the schedule status, enabled state, and next calculated run time for a specific Figranium task. Safe to retry.',
    idempotent: true,
  },
  props: { taskId: taskIdDropdown },
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
