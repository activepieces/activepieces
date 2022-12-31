
import { StoreOperation, TriggerType, ActionType } from 'shared';
declare type ConfigsAndTheirValues = { [key: string]: any };
interface InputFormsSchemaBase {
	type?: ActionType | TriggerType;
}
export interface LoopStepInputFormSchema extends InputFormsSchemaBase {
	items: string;
}
export interface ResponseStepInputFormSchema extends InputFormsSchemaBase {
	output: any;
}
export interface CodeStepInputFormSchema extends InputFormsSchemaBase {
	input: any;
}

export interface StorageStepInputFormSchema extends InputFormsSchemaBase {
	operation: StoreOperation	;
	key: string;
	value: string;
}

export interface ScheduledTriggerInputFormSchema extends InputFormsSchemaBase {
	cronExpression: string;
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
