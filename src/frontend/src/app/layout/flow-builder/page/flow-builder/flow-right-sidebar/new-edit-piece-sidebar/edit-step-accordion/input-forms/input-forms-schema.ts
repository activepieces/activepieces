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
	cron_expression: string;
}
export interface EventTriggerInputFormSchema extends InputFormsSchemaBase {
	eventsName: string[];
}

//TODO figure out a way to check the type of the (input form schema) because right now they are interfaces and instance of won't work since these are json objects from the server
export interface ComponentActionInputFormSchema extends InputFormsSchemaBase {
	component_name: string;
	action_name: string;
	input: ConfigsAndTheirValues | CustomRequestForComponentFormSchema;
}
export interface ComponentTriggerInputFormSchema extends InputFormsSchemaBase {
	component_name: string;
	trigger_name: string;
	input: ConfigsAndTheirValues;
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
	| ComponentActionInputFormSchema;
