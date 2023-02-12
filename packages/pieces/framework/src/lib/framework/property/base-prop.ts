import { PropertyType } from "@activepieces/shared";

export type BasePropertySchema = {
	displayName: string;
	description?: string;
	required: boolean;
};

export type TPropertyValue<T, U> = {
	valueSchema: T | undefined
	type: U;
}

export interface ShortTextProperty extends BasePropertySchema, TPropertyValue<string, PropertyType.SHORT_TEXT> { }

export interface LongTextProperty extends BasePropertySchema, TPropertyValue<string, PropertyType.LONG_TEXT> { }

export interface SecretTextProperty extends BasePropertySchema, TPropertyValue<string, PropertyType.SECRET_TEXT> { }

export interface CheckboxProperty extends BasePropertySchema, TPropertyValue<boolean, PropertyType.CHECKBOX> { }

export interface NumberProperty extends BasePropertySchema, TPropertyValue<number, PropertyType.NUMBER> { }

export interface ArrayProperty extends BasePropertySchema, TPropertyValue<unknown[], PropertyType.ARRAY> { }

export interface ObjectProperty extends BasePropertySchema, TPropertyValue<Record<string, unknown>, PropertyType.OBJECT> { }

export interface JsonProperty extends BasePropertySchema, TPropertyValue<Record<string, unknown>, PropertyType.JSON> { }
