import { TriggerStrategy } from '@activepieces/pieces-framework';
import { createTrigger, Property } from '@activepieces/pieces-framework';
import { DAY_HOURS, timezoneOptions, validateHours } from '../common';

export const everyDayTrigger = createTrigger({
  name: 'every_day',
  displayName: 'Every Day',
  description: 'Triggers the current flow every day',
  type: TriggerStrategy.POLLING,
  sampleData: {},
  props: {
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
      defaultValue: 0,
    }),
    timezone: Property.StaticDropdown<string>({
      displayName: 'Timezone',
      options: {
        options: timezoneOptions,
      },
      required: true,
      defaultValue: 'UTC',
    }),
    run_on_weekends: Property.Checkbox({
      displayName: 'Run on weekends (Sat,Sun)',
      required: true,
      defaultValue: false,
    }),
  },
  onEnable: async (ctx) => {
    const hourOfTheDay = validateHours(ctx.propsValue.hour_of_the_day);
    const cronExpression = ctx.propsValue.run_on_weekends
      ? `0 ${hourOfTheDay} * * *`
      : `0 ${hourOfTheDay} * * 1-5`;
    ctx.setSchedule({
      cronExpression: cronExpression,
      timezone: ctx.propsValue.timezone,
    });
  },
  run(ctx) {
    const hourOfTheDay = validateHours(ctx.propsValue.hour_of_the_day);
    return Promise.resolve([
      {
        hour_of_the_day: hourOfTheDay,
        timezone: ctx.propsValue.timezone,
        cron_expression: ctx.propsValue.run_on_weekends
          ? `0 ${hourOfTheDay} * * *`
          : `0 ${hourOfTheDay} * * 1-5`,
      },
    ]);
  },
  onDisable: async () => {
    console.log('onDisable');
  },
});
