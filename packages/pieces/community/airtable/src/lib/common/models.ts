import { Property } from '@activepieces/pieces-framework';

export interface AirtableBase {
  id: string;
  name: string;
  permissionLevel: AirtablePermissionLevel;
  workspaceId?: string;
}

export interface AirtableRecord {
  fields: Record<string, unknown>;
  createdTime: Date;
  id: string;
}
export interface AirtableField {
  id: string;
  name: string;
  description: string;
  type: AirtableFieldType;
  options?: {
    choices: AirtableChoice[];
  };
}
export interface AirtableChoice {
  id: string;
  name: string;
  color: string;
}

export interface AirtableTable {
  id: string;
  name: string;
  fields: AirtableField[];
  description: string;
  primaryFieldId: string;
  views: {
    id: string;
    name: string;
    type: string;
  }[];
}

export interface AirtableView {
  id: string;
  name: string;
}
export interface AirtableCreateRecordBody {
  records?: AirtableRecord[];
  fields?: Record<string, unknown>;
}

declare type AirtablePermissionLevel =
  | 'none'
  | 'read'
  | 'comment'
  | 'edit'
  | 'create';
export type AirtableFieldType =
  | 'singleLineText'
  | 'email'
  | 'url'
  | 'multilineText'
  | 'number'
  | 'percent'
  | 'currency'
  | 'singleSelect'
  | 'multipleSelects'
  | 'multipleRecordLinks'
  | 'date'
  | 'dateTime'
  | 'phoneNumber'
  | 'multipleAttachments'
  | 'checkbox'
  | 'formula'
  | 'createdTime'
  | 'rollup'
  | 'count'
  | 'lookup'
  | 'multipleLookupValues'
  | 'autoNumber'
  | 'barcode'
  | 'rating'
  | 'richText'
  | 'duration'
  | 'lastModifiedTime'
  | 'button'
  | 'createdBy'
  | 'lastModifiedBy'
  | 'externalSyncSource';

export const AirtableEnterpriseFields = [
  'singleCollaborator',
  'multipleCollaborators',
  'aiText',
];

export interface AirtableComment {
  id: string;
  createdTime: string;
  lastUpdatedTime: string | null;
  text: string;
  parentCommentId?: string;
  author: {
    id: string;
    email: string;
    name?: string;
  };
  mentioned?: Record<
    string,
    {
      id: string;
      type: 'user' | 'userGroup';
      displayName: string;
      email?: string;
    }
  >;
  reactions?: Array<{
    emoji: {
      unicodeCharacter: string;
    };
    reactingUser: {
      userId: string;
      email: string;
      name?: string;
    };
  }>;
}

export interface AirtableFieldConfig {
  name: string;
  description?: string;
  type: AirtableFieldType;
  options?: any;
}

export interface AirtableTableConfig {
  name: string;
  description?: string;
  fields: AirtableFieldConfig[];
}

export interface AirtableCreateBaseResponse {
  id: string;
  tables: AirtableTable[];
}

export const AirtableFieldMapping = {
  singleLineText: Property.ShortText,
  email: Property.ShortText,
  url: Property.ShortText,
  multilineText: Property.LongText,
  number: Property.Number,
  percent: Property.ShortText,
  currency: Property.ShortText,
  singleSelect: Property.StaticDropdown,
  multipleSelects: Property.StaticMultiSelectDropdown,
  multipleRecordLinks: Property.Array,
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
};
