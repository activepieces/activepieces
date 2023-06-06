import { createAction, Property } from "@activepieces/pieces-framework";
import { ExecutionType, PauseType } from "@activepieces/shared";

export const delayTillAction = createAction({
    name: 'delayTill',
    displayName: 'Delay Till',
    description: 'Delays the execution of the next action till a given timestamp',
    props: {
        delayTill: Property.DateTime({
            displayName: 'Timestamp',
            description: 'The timestamp till when the delay the execution of the next action should be delayed',
            required: true,
        }),
    },
    async run(ctx) {
		const delayTill = new Date(ctx.propsValue.delayTill);
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
		} else if (delayInMs > 5 * 60 * 1000){
			// use flow pause
			const currentTime = new Date();
			const futureTime = new Date(currentTime.getTime() + delayInMs);
			ctx.run.pause({
				pauseMetadata: {
					type: PauseType.DELAY,
					resumeDateTime: futureTime.toUTCString()
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