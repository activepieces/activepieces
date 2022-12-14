import type {Authentication} from '../../common/authentication/core/authentication';
import type {TriggerType} from './trigger-type';

export type Trigger = {
	name: string;
	description: string;
	type: TriggerType;
	onCreate: (auth: Authentication) => Promise<Record<string, any>>;
	onDestroy: (auth: Authentication, triggerId: string) => Promise<Record<string, any>>;
	onEvent: (event: Record<string, any>) => Promise<Record<string, any>>;
};
