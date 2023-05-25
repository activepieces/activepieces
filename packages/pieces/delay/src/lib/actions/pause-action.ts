import { createAction, Property } from "@activepieces/pieces-framework";
import { ExecutionType, PauseType } from "@activepieces/shared";
import dayjs from 'dayjs'

export const pauseAction = createAction({
    name: 'pause',
    displayName: 'Pause',
    description: 'Pauses execution by given seconds',
    props: {
        pause: Property.Number({
            displayName: 'Seconds',
            description: 'The number of seconds to pause the execution of the next action',
            required: true,
        }),
    },
    async run(ctx) {
        const { pause } = ctx.propsValue

        if (ctx.executionType === ExecutionType.BEGIN ) {
            ctx.pauseHook({
                pauseMetadata: {
                    type: PauseType.DELAY,
                    resumeDateTime: dayjs().add(pause, 'seconds').toISOString(),
                }
            })
        }

        return {
            pause,
            success: true,
        };
    },
});
