const FIELD_TYPE_BY_ID: Record<string, FireberryFieldType> = {
  'a1e7ed6f-5083-477b-b44c-9943a6181359': 'text',
  'ce972d02-5013-46d4-9d1d-f09df1ac346a': 'datetime',
  '83bf530c-e04c-462b-9ffc-a46f750fc072': 'date',
  '6a34bfe3-fece-4da1-9136-a7b1e5ae3319': 'number',
  'a8fcdf65-91bc-46fd-82f6-1234758345a1': 'lookup',
  'b4919f2e-2996-48e4-a03c-ba39fb64386c': 'picklist',
  '80108f9d-1e75-40fa-9fa9-02be4ddc1da1': 'longtext',
  'c713d2f7-8fa9-43c3-8062-f07486eaf567': 'email',
  'c820d32f-44df-4c2a-9c1e-18734e864fd5': 'url',
  '3f62f67a-1cee-403a-bec6-aa02a9804edb': 'phone',
  'ed2ad39d-32fc-4585-8f5b-2e93463f050a': 'html',
};

function fieldTypeFromId(systemFieldTypeId: string): FireberryFieldType {
  return FIELD_TYPE_BY_ID[systemFieldTypeId] ?? 'unknown';
}

export const fireberryFieldTypes = { fieldTypeFromId };

export type FireberryFieldType =
  | 'text'
  | 'datetime'
  | 'date'
  | 'number'
  | 'lookup'
  | 'picklist'
  | 'longtext'
  | 'email'
  | 'url'
  | 'phone'
  | 'html'
  | 'unknown';
