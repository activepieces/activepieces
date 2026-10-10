import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figraniumAuth } from '../auth';
import { figraniumClient } from '../common/client';

export const getSchedulerStatusAction = createAction({
  auth: figraniumAuth,
  name: 'get_scheduler_status',
  displayName: 'Get Scheduler Status',
  description: 'Return the overall status of the task scheduler',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the overall status of the Figranium scheduler engine, covering every scheduled task at once. Use this instead of Get Schedule Status when you need a system-wide view rather than a single task. Safe to retry.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return figraniumClient({
      baseUrl: context.auth.props.baseUrl,
      apiKey: context.auth.props.apiKey,
      method: HttpMethod.GET,
      resourceUri: '/api/schedules/status/all',
    });
  },
});
