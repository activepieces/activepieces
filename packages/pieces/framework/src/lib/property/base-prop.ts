import { PropertyType } from "./property";

export type BasePropertySchema = {
    displayName: string;
    description?: string;
}

type PieceAuthValidatorParams<AuthValueSchema> = {
    auth: AuthValueSchema
}

export type PieceAuthValidatorResponse =
  | { valid: true }
  | { valid: false; error: string };

export type BasePieceAuthSchema<AuthValueSchema> = BasePropertySchema & {
    validate?: (params: PieceAuthValidatorParams<AuthValueSchema>) => Promise<PieceAuthValidatorResponse>
}

export type MarkDownPropertySchema = {
	value: string
}

export type TPropertyValue<T, U extends PropertyType, REQUIRED extends boolean> = {
    valueSchema: T;
    type: U;
    required: REQUIRED;
    defaultValue?: U extends PropertyType.ARRAY ? unknown[] :
    U extends PropertyType.JSON ? object :
    U extends PropertyType.CHECKBOX ? boolean :
    U extends PropertyType.LONG_TEXT ? string :
    U extends PropertyType.SHORT_TEXT ? string :
    U extends PropertyType.NUMBER ? number :
    U extends PropertyType.DROPDOWN ? unknown :
    U extends PropertyType.MULTI_SELECT_DROPDOWN ? unknown[] :
    U extends PropertyType.STATIC_MULTI_SELECT_DROPDOWN ? unknown[] :
    U extends PropertyType.STATIC_DROPDOWN ? unknown :
    U extends PropertyType.DATE_TIME ? string :
    U extends PropertyType.FILE ? ApFile :
    unknown;
};

export type ShortTextProperty<R extends boolean> = BasePropertySchema & TPropertyValue<string, PropertyType.SHORT_TEXT, R>;

export type LongTextProperty<R extends boolean> = BasePropertySchema & TPropertyValue<string, PropertyType.LONG_TEXT, R>;

export type MarkDownProperty= BasePropertySchema & TPropertyValue<never, PropertyType.MARKDOWN, true>;

export type SecretTextProperty<R extends boolean> = BasePieceAuthSchema<string> & TPropertyValue<string, PropertyType.SECRET_TEXT, R>;

export type CheckboxProperty<R extends boolean> = BasePropertySchema & TPropertyValue<boolean, PropertyType.CHECKBOX, R>;

export type NumberProperty<R extends boolean> = BasePropertySchema & TPropertyValue<number, PropertyType.NUMBER, R>;

export type ArrayProperty<R extends boolean> = BasePropertySchema & TPropertyValue<unknown[], PropertyType.ARRAY, R>;

export type ObjectProperty<R extends boolean> = BasePropertySchema & TPropertyValue<Record<string, unknown>, PropertyType.OBJECT, R>;

export type JsonProperty<R extends boolean> = BasePropertySchema & TPropertyValue<Record<string, unknown>, PropertyType.JSON, R>;

export type DateTimeProperty<R extends boolean> = BasePropertySchema & TPropertyValue<string, PropertyType.DATE_TIME, R>;

export type ApFile = {
    filename?: string;
    extension?: string;
    base64: string;
}

export type FileProperty<R extends boolean> = BasePropertySchema & TPropertyValue<ApFile, PropertyType.FILE, R>;
