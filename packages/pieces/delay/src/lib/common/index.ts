import { ActionContext } from "@activepieces/pieces-framework";
import { ExecutionType, PauseType } from "@activepieces/shared";
import dayjs from "dayjs";

export async function delayUntil(context: ActionContext, date: Date) {
	const delayInMs = date.getTime() - Date.now();
	if(context.executionType == ExecutionType.RESUME) {
		return {
			delayTill: date,
			success: true
		}
	} else if (delayInMs <= 0) {
		// resume immediately
		return {
			delayUntil : date,
			success    : true
		};
	} else if (delayInMs > 1 * 60 * 1000){
		// use flow pause
		const currentTime = new Date();
		const futureTime = dayjs(currentTime.getTime() + delayInMs);
		context.run.pause({
			pauseMetadata: {
				type: PauseType.DELAY,
				resumeDateTime: futureTime.toISOString()
			}
		});
		return {
			delayUntil : date, // return the date that actions that may need this can get it. Also for testing
		};
	} else {

		await new Promise((resolve) => setTimeout(resolve, delayInMs));
		return {
			delayUntil : date,
			success  : true,
		};
	}
}
