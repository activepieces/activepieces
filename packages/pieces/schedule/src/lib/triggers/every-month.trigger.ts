import { TriggerStrategy } from "@activepieces/pieces-framework";
import { createTrigger, Property } from "@activepieces/pieces-framework";
import { DAY_HOURS, MONTH_DAYS,  validateHours,  validateMonthDays  } from "../common";

export const everyMonthTrigger= createTrigger({
    name: 'every_month',
    displayName: 'Every Month',
    description: 'Triggers the current flow every month',
    type: TriggerStrategy.POLLING,
    sampleData: {},
    props:{
        day_of_the_month: Property.StaticDropdown({
            displayName:'Day of the month',
            options:{
                options: MONTH_DAYS.map((d,idx)=>{
                    return {
                        label:(1+d).toString(),
                        value:(idx+1)
                    }
                })
            },
            required:true,
        }),
        hour_of_the_day: Property.StaticDropdown({
            displayName:'Hour of the day (UTC)',
            options:{
                options: DAY_HOURS.map((d,idx)=>{
                    return {
                        label:d,
                        value:idx
                    }
                })
            },
            required:true,
        }),
    },
    onEnable: async (ctx) => {
        const hourOfTheDay = validateHours(ctx.propsValue.hour_of_the_day);
        const dayOfTheMonth = validateMonthDays(ctx.propsValue.day_of_the_month);
        const cronExpression = `0 ${hourOfTheDay} ${dayOfTheMonth} * *`
        ctx.setSchedule({
            cronExpression: cronExpression,
        });       
    },
    run(ctx) {
        const hourOfTheDay = validateHours(ctx.propsValue.hour_of_the_day);
        const dayOfTheMonth = validateMonthDays(ctx.propsValue.day_of_the_month);
        const cronExpression = `0 ${hourOfTheDay} ${dayOfTheMonth} * *`
        return Promise.resolve([{
            hour_of_the_day: hourOfTheDay,
            day_of_the_month: dayOfTheMonth,
            cron_expression: cronExpression
        }]);
    },
    onDisable: async () => {
        console.log('onDisable');
    }
});