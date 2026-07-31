import { TriggerStrategy } from '@activepieces/pieces-framework';
import { createTrigger, Property } from '@activepieces/pieces-framework';

export const everyHourTrigger = createTrigger({
  name: 'every_hour',
  displayName: 'Every Hour',
  description: 'Triggers the current flow every hour',
  aiMetadata: {
    description:
      'Fires at the top of every hour, in either of two modes: all seven days, or Monday-Friday only when weekends are excluded; each event represents an hourly tick, not an external change. Pick this for hourly recurrence; use Every X Minutes for a finer interval, Every Day for a single daily run at a chosen hour, or Cron Expression for anything more specific. The hour boundary is always evaluated in UTC - this trigger has no timezone option, so use Cron Expression if local time matters.',
  },
  type: TriggerStrategy.POLLING,
  sampleData: {},
  props: {
    run_on_weekends: Property.Checkbox({
      displayName: 'Run on weekends (Sat,Sun)',
      required: true,
      defaultValue: false,
    }),
  },
  onEnable: async (ctx) => {
    const cronExpression = ctx.propsValue.run_on_weekends
      ? `0 * * * *`
      : `0 * * * 1-5`;
    ctx.setSchedule({
      cronExpression: cronExpression,
      timezone: 'UTC',
    });
  },
  run(ctx) {
    const cronExpression = ctx.propsValue.run_on_weekends
      ? `0 * * * *`
      : `0 * * * 1-5`;
    return Promise.resolve([
      {
        cron_expression: cronExpression,
        timezone: 'UTC',
      },
    ]);
  },
  onDisable: async () => {
    console.log('onDisable');
  },
});
