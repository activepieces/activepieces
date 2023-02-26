import { Property } from "@activepieces/framework";

export interface AirtableBase {
    id: string;
    name: string;
    permissionLevel: AirtablePermissionLevel
}

export interface AirtableRecord {
    fields: Record<string, unknown>,
    createdTime: Date,
    id: string;
}
export interface AirtableTable {
    description: string
    fields: {
        id: string
        name: string
        type: AirtableFieldType
        description: string,
        options?: Record<string, unknown>
    }[],
    id: string
    name: string
    primaryFieldId: string
    views: {
        id: string
        name: string
        type: string
    }[]
}

export interface AirtableCreateRecordBody {
    records?: AirtableRecord[],
    fields?: Record<string, unknown>
}

declare type AirtablePermissionLevel = "none" | "read" | "comment" | "edit" | "create";
export type AirtableFieldType = "singleLineText"
  | "email"
  | "url"
  | "multilineText"
  | "number"
  | "percent"
  | "currency"
  | "singleSelect"
  | "multipleSelects"
  | "singleCollaborator"
  | "multipleCollaborators"
  | "multipleRecordLinks"
  | "date"
  | "dateTime"
  | "phoneNumber"
  | "multipleAttachments"
  | "checkbox"
  | "formula"
  | "createdTime"
  | "rollup"
  | "count"
  | "lookup"
  | "multipleLookupValues"
  | "autoNumber"
  | "barcode"
  | "rating"
  | "richText"
  | "duration"
  | "lastModifiedTime"
  | "button"
  | "createdBy"
  | "lastModifiedBy"
  | "externalSyncSource"

export const AirtableFieldMapping = {
  singleLineText: Property.ShortText,
  email: Property.ShortText,
  url: Property.ShortText,
  multilineText: Property.LongText,
  number: Property.Number,
  percent: Property.ShortText,
  currency: Property.ShortText,
  singleSelect: Property.ShortText,
  multipleSelects: Property.ShortText,
  singleCollaborator: Property.ShortText,
  multipleCollaborators: Property.ShortText,
  multipleRecordLinks: Property.ShortText,
  date: Property.ShortText,
  dateTime: Property.ShortText,
  phoneNumber: Property.ShortText,
  multipleAttachments: Property.ShortText,
  checkbox: Property.Checkbox,
  formula: Property.ShortText,
  createdTime: Property.ShortText,
  rollup: Property.ShortText,
  count: Property.ShortText,
  lookup: Property.ShortText,
  multipleLookupValues: Property.ShortText,
  autoNumber: Property.Number,
  barcode: Property.ShortText,
  rating: Property.ShortText,
  richText: Property.ShortText,
  duration: Property.ShortText,
  lastModifiedTime: Property.ShortText,
  button: Property.ShortText,
  createdBy: Property.ShortText,
  lastModifiedBy: Property.ShortText,
  externalSyncSource: Property.ShortText,
}