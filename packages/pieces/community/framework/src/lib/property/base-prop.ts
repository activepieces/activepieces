import { ProcessorFn } from '../processors/types';
import { TypedValidatorFn, ValidationInputType } from '../validators/types';
import { PropertyType } from './property';

export type BasePropertySchema = {
  displayName: string;
  description?: string;
};

type PieceAuthValidatorParams<AuthValueSchema> = {
  auth: AuthValueSchema;
};

export type PieceAuthValidatorResponse =
  | { valid: true }
  | { valid: false; error: string };

export type BasePieceAuthSchema<AuthValueSchema> = BasePropertySchema & {
  validate?: (
    params: PieceAuthValidatorParams<AuthValueSchema>
  ) => Promise<PieceAuthValidatorResponse>;
};

export type MarkDownPropertySchema = {
  value: string;
};

export type TPropertyValue<
  T,
  U extends PropertyType,
  VALIDATION_INPUT extends ValidationInputType,
  REQUIRED extends boolean
> = {
  valueSchema: T;
  type: U;
  required: REQUIRED;
  defaultProcessors?: ProcessorFn[];
  processors?: ProcessorFn[];
  validators?: TypedValidatorFn<VALIDATION_INPUT>[];
  defaultValidators?: TypedValidatorFn<VALIDATION_INPUT>[];
  defaultValue?: U extends PropertyType.ARRAY
    ? unknown[]
    : U extends PropertyType.JSON
    ? object
    : U extends PropertyType.CHECKBOX
    ? boolean
    : U extends PropertyType.LONG_TEXT
    ? string
    : U extends PropertyType.SHORT_TEXT
    ? string
    : U extends PropertyType.NUMBER
    ? number
    : U extends PropertyType.DROPDOWN
    ? unknown
    : U extends PropertyType.MULTI_SELECT_DROPDOWN
    ? unknown[]
    : U extends PropertyType.STATIC_MULTI_SELECT_DROPDOWN
    ? unknown[]
    : U extends PropertyType.STATIC_DROPDOWN
    ? unknown
    : U extends PropertyType.DATE_TIME
    ? string
    : U extends PropertyType.FILE
    ? ApFile
    : unknown;
};

export type ShortTextProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<
    string,
    PropertyType.SHORT_TEXT,
    ValidationInputType.STRING,
    R
  >;

export type LongTextProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<string, PropertyType.LONG_TEXT, ValidationInputType.STRING, R>;

export type MarkDownProperty = BasePropertySchema &
  TPropertyValue<never, PropertyType.MARKDOWN, ValidationInputType.ANY, true>;

export type SecretTextProperty<R extends boolean> =
  BasePieceAuthSchema<string> &
    TPropertyValue<
      string,
      PropertyType.SECRET_TEXT,
      ValidationInputType.STRING,
      R
    >;

export type CheckboxProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<boolean, PropertyType.CHECKBOX, ValidationInputType.ANY, R>;

export type NumberProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<number, PropertyType.NUMBER, ValidationInputType.NUMBER, R>;

export type ArrayProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<unknown[], PropertyType.ARRAY, ValidationInputType.ARRAY, R>;

export type ObjectProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<
    Record<string, unknown>,
    PropertyType.OBJECT,
    ValidationInputType.OBJECT,
    R
  >;

export type JsonProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<
    Record<string, unknown>,
    PropertyType.JSON,
    ValidationInputType.JSON,
    R
  >;

export type DateTimeProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<
    string,
    PropertyType.DATE_TIME,
    ValidationInputType.DATE_TIME,
    R
  >;

export class ApFile {
  constructor(
    public filename: string,
    public data: Buffer,
    public extension?: string
  ) {}

  get base64(): string {
    return this.data.toString('base64');
  }
}

export type FileProperty<R extends boolean> = BasePropertySchema &
  TPropertyValue<ApFile, PropertyType.FILE, ValidationInputType.FILE, R>;
