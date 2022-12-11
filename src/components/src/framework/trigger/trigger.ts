import type {TriggerType} from './trigger-type';

export type Trigger = {
	name: string;
	description: string;
	type: TriggerType;
	callback: (request: Record<string, any>) => Promise<Record<string, any>>;
};
