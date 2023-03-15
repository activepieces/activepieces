import { createAction, Property } from "@activepieces/framework";

export const delayAction = createAction({
    name: 'delay',
    displayName: 'Delay',
    description: 'Delays the execution of the next action by maximum 5 minutes',
    props: {
        delay: Property.Number({
            displayName: 'Seconds',
            description: 'The number of seconds to delay the execution of the next action',
            required: true,
        }),
    },
    async run(ctx) {
        const delayInMs = Math.min(ctx.propsValue.delay * 1000, 5 * 60 * 1000);
        await new Promise((resolve) => setTimeout(resolve, delayInMs));
        return {
            delay: delayInMs,
            success: true,
        };
    },
});