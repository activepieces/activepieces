import { PropertyType } from "@activepieces/shared";

export type BasePropertySchema = {
	displayName: string;
	description?: string;
}

export type TPropertyValue<T, U extends PropertyType, REQUIRED extends boolean> = {
	valueSchema: T;
	type: U;
	required: REQUIRED;
};

export type ShortTextProperty<R extends boolean> = BasePropertySchema & TPropertyValue<string, PropertyType.SHORT_TEXT, R>;

export type LongTextProperty<R extends boolean> = BasePropertySchema & TPropertyValue<string, PropertyType.LONG_TEXT, R>;

export type SecretTextProperty<R extends boolean> = BasePropertySchema & TPropertyValue<string, PropertyType.SECRET_TEXT, R>;

export type CheckboxProperty<R extends boolean> = BasePropertySchema & TPropertyValue<boolean, PropertyType.CHECKBOX, R>;

export type NumberProperty<R extends boolean> = BasePropertySchema & TPropertyValue<number, PropertyType.NUMBER, R>;

export type ArrayProperty<R extends boolean> = BasePropertySchema & TPropertyValue<unknown[], PropertyType.ARRAY, R>;

export type ObjectProperty<R extends boolean> = BasePropertySchema & TPropertyValue<Record<string, unknown>, PropertyType.OBJECT, R>;

export type JsonProperty<R extends boolean> = BasePropertySchema & TPropertyValue<Record<string, unknown>, PropertyType.JSON, R>;


