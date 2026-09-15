import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figraniumAuth } from '../auth';
import { figraniumClient } from '../common/client';
import { taskIdDropdown } from '../common/props';
import { buildScheduleBody, scheduleConfigProps, scheduleModeDropdown } from '../common/schedule-props';

export const describeScheduleAction = createAction({
  auth: figraniumAuth,
  name: 'describe_schedule',
  displayName: 'Describe Schedule',
  description: 'Validate and preview a schedule config without saving it',
  audience: 'both',
  aiMetadata: {
    description: 'Validates a schedule configuration and previews its next run times without saving it.',
    idempotent: true,
  },
  props: {
    taskId: taskIdDropdown,
    scheduleMode: scheduleModeDropdown,
    scheduleConfig: scheduleConfigProps,
  },
  async run(context) {
    const { taskId, scheduleMode, scheduleConfig } = context.propsValue;
    const body = buildScheduleBody({ scheduleMode, scheduleConfig });
    return figraniumClient({
      baseUrl: context.auth.props.baseUrl,
      apiKey: context.auth.props.apiKey,
      method: HttpMethod.POST,
      resourceUri: `/api/schedules/${encodeURIComponent(taskId)}/describe`,
      body,
    });
  },
});
