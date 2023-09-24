import { Property, TriggerStrategy, Validators, createTrigger } from "@activepieces/pieces-framework";

export const everyXMinutesTrigger = createTrigger({
    name: 'every_x_minutes',
    displayName: 'Every X Minutes',
    description: 'Triggers the current flow every X minutes',
    type: TriggerStrategy.POLLING,
    sampleData: {},
    props: {
        minutes: Property.Number({
            displayName: "Minutes",
            required: true,
            defaultValue: 1,
            validators: [Validators.minValue(1)]
        })
    },
    onEnable: async (ctx) => {
        const cronExpression = `*/${ctx.propsValue.minutes} * * * *`
        ctx.setSchedule({
            cronExpression: cronExpression,
            timezone: 'UTC'
        });
    },
    async run(ctx) {
        const cronExpression = `*/${ctx.propsValue.minutes} * * * *`

        const payload = [
            {
                cron_expression: cronExpression,
                timezone: 'UTC'
            }
        ];

        return {
            payload,
        }
    },
    onDisable: async () => {
        console.log('onDisable');
    }

});
