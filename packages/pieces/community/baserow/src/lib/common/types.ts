import { BaserowFieldType } from './constants';

interface BaserowCommonField {
  id: number;
  table_id: number;
  name: string;
  order: number;
  primary: boolean;
  read_only: boolean;
}
interface TextField extends BaserowCommonField {
  type: BaserowFieldType.TEXT;
  text_default: string;
}
interface BooleanField extends BaserowCommonField {
  type: BaserowFieldType.BOOLEAN;
}
interface LongTextField extends BaserowCommonField {
  type: BaserowFieldType.LONG_TEXT;
}
interface LastModiedByField extends BaserowCommonField {
  type: BaserowFieldType.LAST_MODIFIED_BY;
}
interface CreatedByField extends BaserowCommonField {
  type: BaserowFieldType.CREATED_BY;
}

interface DurationField extends BaserowCommonField {
  type: BaserowFieldType.DURATION;
  duration_format:string
}

interface EmailField extends BaserowCommonField {
  type: BaserowFieldType.EMAIL;
}
interface URLField extends BaserowCommonField {
  type: BaserowFieldType.URL;
}
interface FileField extends BaserowCommonField {
  type: BaserowFieldType.FILE;
}
interface LinkToTableField extends BaserowCommonField {
  type: BaserowFieldType.LINK_TO_TABLE;
  link_row_table_id: number;
  link_row_related_field_id: number;
  link_row_table: number;
  link_row_related_field: number;
}
interface NumberField extends BaserowCommonField {
  type: BaserowFieldType.NUMBER;
  number_decimal_places: number;
  number_negative: boolean;
}
interface RatingField extends BaserowCommonField {
  type: BaserowFieldType.RATING;
  max_value: number;
  color: string;
  style: string;
}
interface DateField extends BaserowCommonField {
  type: BaserowFieldType.DATE;
  date_format: string;
  date_include_time: boolean;
  date_time_format: string;
  date_show_tzinfo: boolean;
  date_force_timezone: string | null;
}
interface LastModifiedFieldD extends BaserowCommonField {
  type: BaserowFieldType.LAST_MODIFIED;
  date_format: string;
  date_include_time: boolean;
  date_time_format: string;
  date_show_tzinfo: boolean;
  date_force_timezone: string | null;
}
interface CreatedOnField extends BaserowCommonField {
  type: BaserowFieldType.CREATED_ON;
  date_format: string;
  date_include_time: boolean;
  date_time_format: string;
  date_show_tzinfo: boolean;
  date_force_timezone: string | null;
}

interface SingleSelectField extends BaserowCommonField {
  type: BaserowFieldType.SINGLE_SELECT;
  select_options: {
    id: number;
    value: string;
    color: string;
  }[];
}
interface MultiSelectField extends BaserowCommonField {
  type: BaserowFieldType.MULTI_SELECT;
  select_options: {
    id: number;
    value: string;
    color: string;
  }[];
}
interface PhoneNumberField extends BaserowCommonField {
  type: BaserowFieldType.PHONE_NUMBER;
}

interface CountField extends BaserowCommonField {
  type: BaserowFieldType.COUNT;
}
interface RollUpField extends BaserowCommonField {
  type: BaserowFieldType.ROLLUP;
}
interface LookUpField extends BaserowCommonField {
  type: BaserowFieldType.LOOKUP;
}
interface UUIDField extends BaserowCommonField {
  type: BaserowFieldType.UUID;
}
interface AutoNumberField extends BaserowCommonField {
  type: BaserowFieldType.AUTO_NUMBER;
}
interface MultipleCollaboratorsField extends BaserowCommonField {
  type: BaserowFieldType.MULTIPLE_COLLABORATORS;
  notify_user_when_added: boolean;
}
export type BaserowField =
  | TextField
  | BooleanField
  | LongTextField
  | LastModiedByField
  | CreatedByField
  | DurationField
  | EmailField
  | URLField
  | FileField
  | LinkToTableField
  | NumberField
  | RatingField
  | DateField
  | LastModifiedFieldD
  | CreatedOnField
  | SingleSelectField
  | MultiSelectField
  | PhoneNumberField
  | CountField
  | RollUpField
  | LookUpField
  | UUIDField
  | AutoNumberField
  | MultipleCollaboratorsField;
