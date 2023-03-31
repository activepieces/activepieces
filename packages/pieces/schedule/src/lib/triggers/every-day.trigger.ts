import { TriggerStrategy } from "@activepieces/shared";
import { createTrigger, Property } from "@activepieces/framework";
import { DAY_HOURS, validateHours,  } from "../common";

export const everyDayTrigger= createTrigger({
    name: 'every_day',
    displayName: 'Every Day',
    description: 'Triggers the current flow every day',
    type: TriggerStrategy.POLLING,
    sampleData: {},
    props:{
        hour_of_the_day: Property.StaticDropdown({
            displayName:'Hour of the day',
            options:{
                options: DAY_HOURS.map((h,idx)=>{
                    return {
                        label:h,
                        value:idx
                    }
                })
            },
            required:true,
        }),
        run_on_weekends : Property.Checkbox({
            displayName:"Run on weekends",
            required:true,
            defaultValue:false
        })
    },
    onEnable: async (ctx) => {
        const hourOfTheDay =validateHours(ctx.propsValue.hour_of_the_day);
        const cronExpression = ctx.propsValue.run_on_weekends? `0 ${hourOfTheDay}  * * *` : `0 ${hourOfTheDay} * * 1-5`
        ctx.setSchedule(cronExpression);        
    },
    run(ctx) {
        const hourOfTheDay =validateHours(ctx.propsValue.hour_of_the_day);
        return Promise.resolve([{
            hour_of_the_day:hourOfTheDay,
            cron_expression: ctx.propsValue.run_on_weekends? `0 ${hourOfTheDay}  * * *` : `0 ${hourOfTheDay} * * 1-5`
        }]);
    },
    onDisable: async () => {
        console.log('onDisable');
    }
});