import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figraniumAuth } from '../auth';
import { figraniumClient } from '../common/client';
import { taskIdDropdown } from '../common/props';

export const describeScheduleAction = createAction({
  auth: figraniumAuth,
  name: 'describe_schedule',
  displayName: 'Describe Schedule',
  description: 'Return full schedule configuration for a single task',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the schedule details for a single Figranium task, including whether it is enabled and its timing configuration. Safe to retry.',
    idempotent: true,
  },
  props: { taskId: taskIdDropdown },
  async run(context) {
    const { taskId } = context.propsValue;
    return figraniumClient({
      baseUrl: context.auth.props.baseUrl,
      apiKey: context.auth.props.apiKey,
      method: HttpMethod.GET,
      resourceUri: `/api/schedules/${encodeURIComponent(taskId)}`,
    });
  },
});
