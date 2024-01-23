import {
  Property,
  TriggerStrategy,
  createTrigger,
} from '@activepieces/pieces-framework';

export const everyXMinutesTrigger = createTrigger({
  name: 'every_x_minutes',
  displayName: 'Every X Minutes',
  description: 'Triggers the current flow every X minutes',
  type: TriggerStrategy.POLLING,
  sampleData: {},
  props: {
    minutes: Property.StaticDropdown({
      displayName: 'Minutes',
      description: 'Valid value between 1 to 59.',
      required: true,
      defaultValue: 1,
      options: {
        disabled: false,
        options: Array.from({ length: 59 }, (_, index) => ({
          label: `${index + 1} minute${index !== 0 ? 's' : ''}`,
          value: index + 1,
        })),
      },
    }),
  },
  onEnable: async (ctx) => {
    const cronExpression = `*/${ctx.propsValue.minutes} * * * *`;
    ctx.setSchedule({
      cronExpression: cronExpression,
      timezone: 'UTC',
    });
  },
  run(ctx) {
    const cronExpression = `*/${ctx.propsValue.minutes} * * * *`;
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
