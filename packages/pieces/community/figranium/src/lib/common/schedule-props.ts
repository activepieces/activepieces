import { DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { figraniumAuth } from '../auth';

export const scheduleModeDropdown = Property.StaticDropdown({
  displayName: 'Schedule Mode',
  description: 'How to express the schedule timing',
  required: true,
  defaultValue: 'frequency',
  options: {
    options: [
      { label: 'Frequency (Interval)', value: 'frequency' },
      { label: 'Cron Expression', value: 'cron' },
    ],
  },
});

export const scheduleConfigProps = Property.DynamicProperties({
  displayName: 'Schedule',
  description: 'The timing details for the schedule',
  required: true,
  auth: figraniumAuth,
  refreshers: ['scheduleMode'],
  props: async ({ scheduleMode }): Promise<DynamicPropsValue> => {
    if (scheduleMode === 'cron') {
      return {
        cronExpression: Property.ShortText({
          displayName: 'Cron Expression',
          description: 'A standard 5-field cron expression (minute hour day month weekday), e.g. 0 9 * * 1',
          required: true,
          defaultValue: '0 9 * * 1',
        }),
      };
    }
    return {
      frequency: Property.StaticDropdown({
        displayName: 'Frequency',
        required: true,
        defaultValue: 'daily',
        options: {
          options: [
            { label: 'Every N Minutes', value: 'interval' },
            { label: 'Daily', value: 'daily' },
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
          ],
        },
      }),
      intervalMinutes: Property.Number({
        displayName: 'Interval (Minutes)',
        description: 'How often to run, in minutes. Only used when Frequency is "Every N Minutes".',
        required: false,
        defaultValue: 60,
      }),
      hour: Property.Number({
        displayName: 'Hour',
        description: 'Hour of day to run (0-23). Used for Daily, Weekly, and Monthly.',
        required: false,
        defaultValue: 9,
      }),
      minute: Property.Number({
        displayName: 'Minute',
        description: 'Minute of hour to run (0-59). Used for Daily, Weekly, and Monthly.',
        required: false,
        defaultValue: 0,
      }),
      daysOfWeek: Property.StaticMultiSelectDropdown({
        displayName: 'Days of Week',
        description: 'Only used when Frequency is "Weekly".',
        required: false,
        options: {
          options: [
            { label: 'Sunday', value: 0 },
            { label: 'Monday', value: 1 },
            { label: 'Tuesday', value: 2 },
            { label: 'Wednesday', value: 3 },
            { label: 'Thursday', value: 4 },
            { label: 'Friday', value: 5 },
            { label: 'Saturday', value: 6 },
          ],
        },
      }),
      dayOfMonth: Property.Number({
        displayName: 'Day of Month',
        description: 'Day of month to run (1-31). Only used when Frequency is "Monthly".',
        required: false,
        defaultValue: 1,
      }),
    };
  },
});

export function buildScheduleBody({
  scheduleMode,
  scheduleConfig,
}: {
  scheduleMode: string;
  scheduleConfig: Record<string, unknown>;
}): Record<string, unknown> {
  if (scheduleMode === 'cron') {
    return { cron: scheduleConfig['cronExpression'] };
  }

  const frequency = scheduleConfig['frequency'] as string;
  const body: Record<string, unknown> = { frequency };

  if (frequency === 'interval') {
    body['intervalMinutes'] = scheduleConfig['intervalMinutes'];
  } else if (frequency === 'weekly') {
    body['hour'] = scheduleConfig['hour'];
    body['minute'] = scheduleConfig['minute'];
    body['daysOfWeek'] = scheduleConfig['daysOfWeek'];
  } else if (frequency === 'monthly') {
    body['hour'] = scheduleConfig['hour'];
    body['minute'] = scheduleConfig['minute'];
    body['dayOfMonth'] = scheduleConfig['dayOfMonth'];
  } else {
    body['hour'] = scheduleConfig['hour'];
    body['minute'] = scheduleConfig['minute'];
  }

  return body;
}
