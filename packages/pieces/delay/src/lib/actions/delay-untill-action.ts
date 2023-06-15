import { createAction } from "@activepieces/pieces-framework";
import { ExecutionType, PauseType } from "@activepieces/shared";

export const delayUntilAction = createAction({
    name: 'delay_until',
    displayName: 'Delay Not',
    description: 'Delays the execution of the next action until a given timestamp',
    props: {
    },
    async run(ctx) {
		if(ctx.executionType === ExecutionType.BEGIN){
			ctx.run.pause({
				pauseMetadata: {
					type: PauseType.WEBHOOK
				}
			});
		}
    },
});