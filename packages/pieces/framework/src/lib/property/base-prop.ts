import { AnyProcessors, DateTimeProcessors, FileProcessors, NumberProcessors } from "../processors/types";
import { AnyValidators, DateTimeValidators, FileValidators, NumberValidators, StringValidators } from "../validators/types";
import { PropertyType } from "./property";

export type BasePropertySchema = {
	displayName: string;
	description?: string;
}

export type TPropertyValue<T, ALLOWED_PROCESSORS, ALLOWED_VALIDATORS, U extends PropertyType, REQUIRED extends boolean> = {
	valueSchema: T;
	type: U;
	required: REQUIRED;
	defaultProcessors?: ALLOWED_PROCESSORS[]; 
	defaultValidators?: ALLOWED_VALIDATORS[];
	processors?: ALLOWED_PROCESSORS[];
	validators?: ALLOWED_VALIDATORS[];
	defaultValue?: U extends PropertyType.ARRAY?  unknown[]:
	 U extends PropertyType.JSON? object:
	 U extends PropertyType.CHECKBOX? boolean:
	 U extends PropertyType.LONG_TEXT? string:
	 U extends PropertyType.SHORT_TEXT? string:
	 U extends PropertyType.NUMBER? number:
	 U extends PropertyType.DROPDOWN? unknown  :
	 U extends PropertyType.MULTI_SELECT_DROPDOWN? unknown[]:
	 U extends PropertyType.STATIC_MULTI_SELECT_DROPDOWN? unknown[]:
	 U extends PropertyType.STATIC_DROPDOWN? unknown:
	 U extends PropertyType.DATE_TIME? string:
	 U extends PropertyType.FILE? ApFile:
	unknown;
};

export type ShortTextProperty<R extends boolean> = BasePropertySchema & TPropertyValue<string, never, StringValidators, PropertyType.SHORT_TEXT, R>;

export type LongTextProperty<R extends boolean> = BasePropertySchema & TPropertyValue<string, never, StringValidators, PropertyType.LONG_TEXT, R>;

export type SecretTextProperty<R extends boolean> = BasePropertySchema & TPropertyValue<string, never, StringValidators, PropertyType.SECRET_TEXT, R>;

export type CheckboxProperty<R extends boolean> = BasePropertySchema & TPropertyValue<boolean, never, never, PropertyType.CHECKBOX, R>;

export type NumberProperty<R extends boolean> = BasePropertySchema & TPropertyValue<number, NumberProcessors, NumberValidators, PropertyType.NUMBER, R>;

export type ArrayProperty<R extends boolean> = BasePropertySchema & TPropertyValue<unknown[], AnyProcessors, AnyValidators, PropertyType.ARRAY, R>;

export type ObjectProperty<R extends boolean> = BasePropertySchema & TPropertyValue<Record<string, unknown>, never, never, PropertyType.OBJECT, R>;

export type JsonProperty<R extends boolean> = BasePropertySchema & TPropertyValue<Record<string, unknown>, never, never, PropertyType.JSON, R>;

export type DateTimeProperty<R extends boolean> = BasePropertySchema & TPropertyValue<string, DateTimeProcessors, DateTimeValidators, PropertyType.DATE_TIME, R>;

export type ApFile = {
    filename?: string;
    extension?: string;
    base64: string;
}

export type FileProperty<R extends boolean> = BasePropertySchema & TPropertyValue<ApFile, FileProcessors, FileValidators, PropertyType.FILE, R>;
