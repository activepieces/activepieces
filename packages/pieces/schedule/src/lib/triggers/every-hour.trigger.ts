import { TriggerStrategy } from "@activepieces/pieces-framework";
import { createTrigger, Property } from "@activepieces/pieces-framework";
import { timezoneOptions } from "../common";


export const everyHourTrigger = createTrigger({
    name: 'every_hour',
    displayName: 'Every Hour',
    description: 'Triggers the current flow every hour',
    type: TriggerStrategy.POLLING,
    sampleData: {},
    props: {
        run_on_weekends: Property.Checkbox({
            displayName: "Run on weekends (Sat,Sun)",
            required: true,
            defaultValue: false
        }),
        timezone: Property.StaticDropdown<string>({
            displayName: "Timezone",
            options: {
                options: timezoneOptions,
            },
            required: true,
            defaultValue: "UTC"
        }),
    },
    onEnable: async (ctx) => {
        const cronExpression = ctx.propsValue.run_on_weekends ? `0 * * * *` : `0 * * * 1-5`
        ctx.setSchedule({
            cronExpression: cronExpression,
            timezone: ctx.propsValue.timezone
        });
    },
    run(ctx) {
        const cronExpression = ctx.propsValue.run_on_weekends ? `0 * * * *` : `0 * * * 1-5`
        return Promise.resolve([{
            cron_expression: cronExpression,
            timezone: ctx.propsValue.timezone
        }]);
    },
    onDisable: async () => {
        console.log('onDisable');
    }
});