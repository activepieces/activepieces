import { TriggerStrategy } from '@activepieces/pieces-framework';
import { createTrigger, Property } from '@activepieces/pieces-framework';
import { timezoneOptions } from '../common';

export const cronExpressionTrigger = createTrigger({
  name: 'cron_expression',
  displayName: 'Cron Expression',
  description: 'Trigger based on cron expression',
  aiMetadata: {
    description:
      'Fires on an arbitrary schedule described by a standard five-field cron expression evaluated in a chosen timezone (e.g. 0/5 * * * *); each event represents a scheduled tick, not an external change. Pick this as the escape hatch when the fixed presets cannot express the cadence - specific minutes, several weekdays, multiple times a day - and prefer Every X Minutes / Every Hour / Every Day / Every Week / Every Month when one of them already fits, since they are easier to get right. Requires a valid cron expression as the critical input: a malformed or overly frequent expression will schedule wrongly or fire far more often than intended.',
  },
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
