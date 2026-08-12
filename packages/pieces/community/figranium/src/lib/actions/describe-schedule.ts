import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figraniumAuth } from '../auth';
import { figraniumClient } from '../common/client';
import { buildScheduleBody, scheduleConfigProps, scheduleModeDropdown } from '../common/schedule-props';

export const describeScheduleAction = createAction({
  auth: figraniumAuth,
  name: 'describe_schedule',
  displayName: 'Describe Schedule',
  description: 'Validate and preview a schedule config without saving it',
  audience: 'both',
  aiMetadata: {
    description:
      'Validates a schedule configuration and previews its next run times without saving it to the task. Use this to check a schedule before committing to it with Set Schedule. Safe to retry, no state is changed.',
    idempotent: true,
  },
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task',
      required: true,
    }),
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
