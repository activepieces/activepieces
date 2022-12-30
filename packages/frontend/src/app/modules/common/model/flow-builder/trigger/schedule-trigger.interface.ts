import { Trigger } from './trigger.interface';

export interface ScheduleTrigger extends Trigger {
	settings: {
		cronExpression: string;
	};
}
