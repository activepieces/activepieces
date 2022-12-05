import { Trigger } from './trigger.interface';

export interface EventTriggerInterface extends Trigger {
	settings: {
		eventsName: string[];
	};
}
