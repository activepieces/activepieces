import { TriggerStrategy } from '@activepieces/pieces-framework';
import { createTrigger, Property } from '@activepieces/pieces-framework';
import { timezoneOptions } from '../common';

export const cronExpressionTrigger = createTrigger({
  name: 'cron_expression',
  displayName: 'Cron Expression',
  description: 'Trigger based on cron expression',
  props: {
    cronExpression: Property.ShortText({
      displayName: 'Cron Expression',
      description: 'Cron expression to trigger',
      required: true,
      defaultValue: '0/5 * * * *',
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
  type: TriggerStrategy.POLLING,
  sampleData: {},
  onEnable: async (ctx) => {
    ctx.setSchedule({
      cronExpression: ctx.propsValue.cronExpression,
      timezone: ctx.propsValue.timezone,
    });
  },
  run(context) {
    return Promise.resolve([{}]);
  },
  onDisable: async () => {
    console.log('onDisable');
  },
});
