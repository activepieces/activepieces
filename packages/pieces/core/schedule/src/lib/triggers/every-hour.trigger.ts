import { TriggerStrategy } from '@activepieces/pieces-framework';
import { createTrigger, Property } from '@activepieces/pieces-framework';

export const everyHourTrigger = createTrigger({
  name: 'every_hour',
  displayName: 'Every Hour',
  description: 'Triggers the current flow every hour',
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
