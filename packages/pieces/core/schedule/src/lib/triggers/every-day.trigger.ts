import { TriggerStrategy } from '@activepieces/pieces-framework';
import { createTrigger, Property } from '@activepieces/pieces-framework';
import { DAY_HOURS, timezoneOptions, validateHours } from '../common';

export const everyDayTrigger = createTrigger({
  name: 'every_day',
  displayName: 'Every Day',
  description: 'Triggers the current flow every day',
  aiMetadata: {
    description:
      'Fires once a day at a chosen hour in a chosen timezone, in either of two modes: every calendar day, or Monday-Friday only when weekends are excluded; each event represents the daily tick, not an external change. Pick this for daily jobs; use Every Hour or Every X Minutes for finer cadence, Every Week / Every Month for coarser, or Cron Expression when the run must land on a specific minute or an irregular day set. Granularity is whole hours only (it always fires at minute 0).',
  },
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
