import { TriggerStrategy } from '@activepieces/pieces-framework';
import { createTrigger, Property } from '@activepieces/pieces-framework';
import {
  DAY_HOURS,
  validateWeekDays,
  validateHours,
  WEEK_DAYS,
  timezoneOptions,
} from '../common';

export const everyWeekTrigger = createTrigger({
  name: 'every_week',
  displayName: 'Every Week',
  description: 'Triggers the current flow every week',
  type: TriggerStrategy.POLLING,
  sampleData: {},
  props: {
    day_of_the_week: Property.StaticDropdown({
      displayName: 'Day of the week',
      options: {
        options: WEEK_DAYS.map((d, idx) => {
          return {
            label: d,
            value: idx,
          };
        }),
      },
      required: true,
    }),
    hour_of_the_day: Property.StaticDropdown({
      displayName: 'Hour of the day',
      options: {
        options: DAY_HOURS.map((h, idx) => {
          return {
            label: h,
            value: idx,
          };
        }),
      },
      required: true,
    }),
    timezone: Property.StaticDropdown<string>({
      displayName: 'Timezone',
      options: {
        options: timezoneOptions,
      },
      required: true,
      defaultValue: 'UTC',
    }),
  },
  onEnable: async (ctx) => {
    const hourOfTheDay = validateHours(ctx.propsValue.hour_of_the_day);
    const dayOfTheWeek = validateWeekDays(ctx.propsValue.day_of_the_week);
    const cronExpression = `0 ${hourOfTheDay} * * ${dayOfTheWeek}`;
    ctx.setSchedule({
      cronExpression: cronExpression,
      timezone: ctx.propsValue.timezone,
    });
  },
  run(ctx) {
    const hourOfTheDay = validateHours(ctx.propsValue.hour_of_the_day);
    const dayOfTheWeek = validateWeekDays(ctx.propsValue.day_of_the_week);
    const cronExpression = `0 ${hourOfTheDay} * * ${dayOfTheWeek}`;
    return Promise.resolve([
      {
        hour_of_the_day: hourOfTheDay,
        day_of_the_week: dayOfTheWeek,
        cron_expression: cronExpression,
        timezone: ctx.propsValue.timezone,
      },
    ]);
  },
  onDisable: async () => {
    console.log('onDisable');
  },
});
