import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { figraniumAuth } from '../auth';
import { figraniumClient } from '../common/client';
import { buildScheduleBody, scheduleConfigProps, scheduleModeDropdown } from '../common/schedule-props';

export const setScheduleAction = createAction({
  auth: figraniumAuth,
  name: 'set_schedule',
  displayName: 'Set Schedule',
  description: 'Create or update a schedule on a task',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates or updates the schedule on a Figranium task, either as a recurring frequency or a cron expression. Use this to make a task run automatically. Safe to retry since it upserts the schedule for the given task ID.',
    idempotent: true,
  },
  props: {
    taskId: Property.ShortText({
      displayName: 'Task ID',
      description: 'The ID of the task',
      required: true,
    }),
    scheduleEnabled: Property.Checkbox({
      displayName: 'Enabled',
      description: 'Whether the schedule should be active',
      required: false,
      defaultValue: true,
    }),
    scheduleMode: scheduleModeDropdown,
    scheduleConfig: scheduleConfigProps,
  },
  async run(context) {
    const { taskId, scheduleEnabled, scheduleMode, scheduleConfig } = context.propsValue;
    const body = {
      enabled: scheduleEnabled ?? true,
      ...buildScheduleBody({ scheduleMode, scheduleConfig }),
    };
    return figraniumClient({
      baseUrl: context.auth.props.baseUrl,
      apiKey: context.auth.props.apiKey,
      method: HttpMethod.POST,
      resourceUri: `/api/schedules/${encodeURIComponent(taskId)}`,
      body,
    });
  },
});
