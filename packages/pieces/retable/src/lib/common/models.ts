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
  //   | 'dropdown'
  | 'currency'
  | 'phonenumber'
  | 'email'
  | 'color'
  | 'calender'
  //   | 'attachment'
  //   | 'image'
  | 'checkbox'
  | 'text';

export const RetableFieldMapping = {
  text: Property.ShortText,
  email: Property.ShortText,
  url: Property.ShortText,
  phonenumber: Property.ShortText,
  currency: Property.ShortText,
  color: Property.ShortText,
  calender: Property.ShortText,
  checkbox: Property.Checkbox,
};
