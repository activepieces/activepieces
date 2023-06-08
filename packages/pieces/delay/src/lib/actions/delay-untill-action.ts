import { createAction, Property } from "@activepieces/pieces-framework";
import { ExecutionType, PauseType } from "@activepieces/shared";
import dayjs from "dayjs";

export const delayUntilAction = createAction({
    name: 'delay_until',
    displayName: 'Delay Until',
    description: 'Delays the execution of the next action until a given timestamp',
    props: {
        delayUntilTimestamp: Property.DateTime({
            displayName: 'Timestamp',
            description: 'The timestamp until when the delay the execution of the next action should be delayed',
            required: true,
        }),
    },
    async run(ctx) {
		const delayTill = new Date(ctx.propsValue.delayUntilTimestamp);
		const delayInMs = delayTill.getTime() - Date.now();
		if(ctx.executionType == ExecutionType.RESUME) {
			return {
				delayTill: delayTill,
				success: true
			}
		} else if (delayInMs <= 0) {
			// resume immediately
			return {
				delayTill: delayTill,
				success: true
			};
		} else if (delayInMs > 1 * 60 * 1000){
			// use flow pause
			const currentTime = new Date();
			const futureTime = dayjs(currentTime.getTime() + delayInMs);
			ctx.run.pause({
				pauseMetadata: {
					type: PauseType.DELAY,
					resumeDateTime: futureTime.toISOString()
				}
			});
			return {}; // irrelevant as the flow is being paused, not completed
		} else {
			// use setTimeout for delayTill between 0 and 5 seconds
			await new Promise((resolve) => setTimeout(resolve, delayInMs));
			return {
				delayTill: delayTill,
				success: true,
			};
		}
    },
});