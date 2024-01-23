import { Property } from '@activepieces/pieces-framework';
export interface RetableWorkspace {
  id: string;
  name: string;
}

export interface RetableProject {
  id: string;
  name: string;
}

export interface RetableField {
  column_id: string;
  title: string;
  type: RetableFieldType;
  created_at?: string;
}
export interface RetableTable {
  id: string;
  title: string;
  description?: string;
  columns: RetableField[];
  project_id: string;
  workspace_id: string;
}

export type RetableFieldType =
  | 'url'
  | 'updated_by'
  // | 'Attachment'
  // | 'Image'
  | 'updated_at'
  | 'created_by'
  | 'created_at'
  | 'user'
  | 'url'
  | 'formula'
  | 'currency'
  | 'phonenumber'
  | 'email'
  | 'color'
  | 'calendar'
  | 'dropdown'
  | 'percent'
  | 'checkbox'
  | 'number'
  | 'rating'
  | 'text';

export const RetableFieldMapping = {
  text: Property.ShortText,
  updated_by: Property.ShortText,
  updated_at: Property.ShortText,
  created_by: Property.ShortText,
  created_at: Property.ShortText,
  user: Property.ShortText,
  url: Property.ShortText,
  formula: Property.ShortText,
  rating: Property.ShortText,
  dropdown: Property.ShortText,
  percent: Property.ShortText,
  email: Property.ShortText,
  phonenumber: Property.ShortText,
  currency: Property.ShortText,
  color: Property.ShortText,
  calendar: Property.ShortText,
  checkbox: Property.Checkbox,
  number: Property.ShortText,
};

export const RetableNotSupportedFields = [
  'attachment',
  'image',
  'updated_by',
  'updated_at',
  'created_by',
  'created_at',
  'user',
  'vote',
  'qr_code',
  'richtext',
];
