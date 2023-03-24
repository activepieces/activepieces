import { TriggerStrategy } from "@activepieces/shared";
import { createTrigger, Property } from "@activepieces/framework";

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
    },
    type: TriggerStrategy.POLLING,
    sampleData: {},
    onEnable: async (ctx) => {
        ctx.setSchedule({
            cronExpression: ctx.propsValue.cronExpression,
        })        
    },
    run(context) {
        return Promise.resolve([{}]);
    },
    onDisable: async () => {
        console.log('onDisable');
    }
});