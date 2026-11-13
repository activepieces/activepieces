import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';

export const createOrUpdateRecurrenceAction = createAction({
  auth: podioAuth,
  name: 'podio_create_or_update_recurrence',
  displayName: 'Create or Update Recurrence',
  description: 'Makes an object, such as a task, repeat weekly, monthly or yearly.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the repeat schedule of one Podio object, such as a task, replacing any schedule already there: weekly on given weekdays, monthly on the same weekday or day of month, or yearly, every Step periods until an optional end date. Use Get Recurrence to read the current schedule and Delete Recurrence to stop it.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.text({ required: true, displayName: 'Object Type', description: 'The type of the object that repeats, such as "task".' }),
    refId: podioAiProps.id({ required: true, displayName: 'Object ID', description: 'The id of the object, e.g. a task id from List Tasks or Get Task.' }),
    name: podioAiProps.choice({ required: true, displayName: 'Frequency', description: 'How often the object repeats.', values: ['weekly', 'monthly', 'yearly'] }),
    days: podioAiProps.idList({ required: false, displayName: 'Weekdays', description: 'For "weekly": the weekdays to repeat on, e.g. ["monday", "thursday"].' }),
    repeatOn: podioAiProps.choice({ required: false, displayName: 'Repeat On', description: 'For "monthly": "day_of_week" repeats on the same weekday of the month, "day_of_month" on the same date.', values: ['day_of_week', 'day_of_month'] }),
    step: podioAiProps.number({ required: true, displayName: 'Step', description: 'Repeat every this many weeks, months or years; 1 or more.' }),
    until: podioAiProps.text({ required: false, displayName: 'Until', description: 'The last date the object may repeat on, as YYYY-MM-DD.' }),
  },
  async run({ auth, propsValue }) {
    const days = propsValue.days && propsValue.days.length > 0 ? propsValue.days : undefined;
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/recurrence/${propsValue.refType}/${propsValue.refId}`,
      body: podioUtils.body({
        values: {
          name: propsValue.name,
          config: podioUtils.body({ values: { days, repeat_on: propsValue.repeatOn } }),
          step: propsValue.step,
          until: propsValue.until,
        },
      }),
    });
  },
});
