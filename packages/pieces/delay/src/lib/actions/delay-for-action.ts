import { createAction, Property } from "@activepieces/pieces-framework";
import { ExecutionType, PauseType } from "@activepieces/shared";

export const delayForAction = createAction({
	name: 'delayFor',
	displayName: 'Delay For',
	description: 'Delays the execution of the next action for a given duration',
	props: {
		delayFor: Property.Number({
			displayName: 'Seconds',
			description: 'The number of seconds to delay the execution of the next action',
			required: true,
		}),
	},
	async run(ctx) {
		const delayInMs = ctx.propsValue.delayFor * 1000;
		if (delayInMs <= 0) {
			throw new Error("Delay must be greater than 0");
		}
		if (ctx.executionType == ExecutionType.RESUME) {
			return {
				delayForInMs: delayInMs,
				success: true
			}
		} else if (delayInMs > 1 * 60 * 1000) {
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
			// use setTimeout
			await new Promise((resolve) => setTimeout(resolve, delayInMs));
			return {
				delayForInMs: delayInMs,
				success: true,
			};
		}
	},
});