import { HttpMethod } from '@activepieces/pieces-common';
import { ZohoAuth, zohoRequest } from './client';

export async function listModules(auth: ZohoAuth): Promise<ZohoModule[]> {
  const body = await zohoRequest<{ modules?: ZohoModule[] }>({
    auth,
    method: HttpMethod.GET,
    path: '/settings/modules',
  });
  return body?.modules ?? [];
}

export async function listFields({ auth, module }: { auth: ZohoAuth; module: string }): Promise<ZohoField[]> {
  const body = await zohoRequest<{ fields?: ZohoField[] }>({
    auth,
    method: HttpMethod.GET,
    path: '/settings/fields',
    query: { module },
  });
  return body?.fields ?? [];
}

const LOW_VALUE_FIELDS = new Set(['Latitude', 'Longitude', 'Coordinates', 'Record_Image']);

function isLowValue(field: ZohoField): boolean {
  return LOW_VALUE_FIELDS.has(field.api_name) || field.api_name.endsWith('__s') || field.api_name.startsWith('$');
}

export function defaultFieldSelection({ fields, max = 50 }: { fields: ZohoField[]; max?: number }): string[] {
  const readable = fields.filter((f) => f.visible !== false && f.api_name && f.api_name !== 'id');
  const custom = readable.filter((f) => f.custom_field === true && !isLowValue(f));
  const standard = readable.filter((f) => f.custom_field !== true && !isLowValue(f));
  const low = readable.filter((f) => isLowValue(f));
  return ['id', ...[...custom, ...standard, ...low].map((f) => f.api_name)].slice(0, max);
}

const NAME_FIELDS = [
  'Full_Name',
  'Account_Name',
  'Deal_Name',
  'Subject',
  'Event_Title',
  'Product_Name',
  'Campaign_Name',
  'Solution_Title',
  'Vendor_Name',
  'Price_Book_Name',
  'Name',
  'Last_Name',
];

export function nameFieldOf(fields: ZohoField[]): string | undefined {
  const names = new Set(fields.map((f) => f.api_name));
  return NAME_FIELDS.find((n) => names.has(n));
}

export type ZohoModule = {
  api_name: string;
  module_name?: string;
  plural_label?: string;
  singular_label?: string;
  api_supported?: boolean;
  creatable?: boolean;
  editable?: boolean;
  deletable?: boolean;
  viewable?: boolean;
  generated_type?: string;
  id?: string;
};

export type ZohoPicklistValue = { display_value?: string; actual_value?: string };

export type ZohoField = {
  api_name: string;
  id?: string;
  field_label?: string;
  display_label?: string;
  data_type?: string;
  json_type?: string;
  system_mandatory?: boolean;
  read_only?: boolean;
  field_read_only?: boolean;
  visible?: boolean;
  custom_field?: boolean;
  length?: number;
  pick_list_values?: ZohoPicklistValue[];
  lookup?: { module?: { api_name?: string } } | null;
  unique?: unknown;
};
