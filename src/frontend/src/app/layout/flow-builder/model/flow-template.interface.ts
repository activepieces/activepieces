import { Config } from '../../common-layout/model/fields/variable/config';
import { Trigger } from '../../common-layout/model/flow-builder/trigger/trigger.interface';

export interface FlowTemplateInterface {
	title: string;
	description: string;
	icon: string;
	version: {
		access: string;
		configs: Config[];
		trigger: Trigger;
	};
}
