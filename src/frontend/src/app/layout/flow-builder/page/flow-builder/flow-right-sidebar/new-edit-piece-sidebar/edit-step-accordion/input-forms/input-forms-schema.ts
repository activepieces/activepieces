import { UUID } from 'angular2-uuid';
import { ActionType } from 'src/app/layout/common-layout/model/enum/action-type.enum';
import { TriggerType } from 'src/app/layout/common-layout/model/enum/trigger-type.enum';
import { StorageOperation } from 'src/app/layout/common-layout/model/flow-builder/actions/storage-operation.enum';
import { StorageScope } from 'src/app/layout/common-layout/model/flow-builder/actions/storage-scope.enum';
declare type ConfigsAndTheirValues = { [key: string]: any };
interface InputFormsSchemaBase {
	type?: ActionType | TriggerType;
}
export interface LoopStepInputFormSchema extends InputFormsSchemaBase {
	items: any;
}
export interface ResponseStepInputFormSchema extends InputFormsSchemaBase {
	output: any;
}
export interface CodeStepInputFormSchema extends InputFormsSchemaBase {
	input: any;
}

export interface StorageStepInputFormSchema extends InputFormsSchemaBase {
	operation: StorageOperation;
	key: string;
	value: string;
	scope: StorageScope;
}

export interface ScheduledTriggerInputFormSchema extends InputFormsSchemaBase {
	cronExpression: string;
}
export interface EventTriggerInputFormSchema extends InputFormsSchemaBase {
	eventsName: string[];
}

export interface RemoteFlowInputFormSchema extends InputFormsSchemaBase {
	input: ConfigsAndTheirValues;
	flowVersionId: UUID;
	pieceVersionId: UUID;
}
//TODO figure out a way to check the type of the (input form schema) because right now they are interfaces and instance of won't work since these are json objects from the server
export interface ComponentInputFormSchema extends InputFormsSchemaBase {
	componentName: string;
	actionName: string;
	componentVersion: string;
	input: {
		action: ConfigsAndTheirValues | CustomRequestForComponentFormSchema;
	};
	manifestUrl: string;
}
interface CustomRequestForComponentFormSchema {
	endpoint: string;
	parameters: { [key: string]: any };
	headers: { [key: string]: any };
	body: { [key: string]: any };
}

export type InputFormsSchema =
	| LoopStepInputFormSchema
	| ResponseStepInputFormSchema
	| StorageStepInputFormSchema
	| CodeStepInputFormSchema
	| ScheduledTriggerInputFormSchema
	| EventTriggerInputFormSchema
	| RemoteFlowInputFormSchema
	| ComponentInputFormSchema;
