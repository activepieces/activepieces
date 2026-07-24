export const NUTSHELL_BASE_URL = 'https://app.nutshell.com/rest';

export type SortFieldDefinition = {
  value: string;
  label: string;
};

/**
 * Nutshell list endpoints accept a `sort` query param that is a bare field name
 * for ascending order, or the field name prefixed with `-` for descending order.
 * This turns a list of sortable fields into a dropdown with both directions.
 */
export function buildSortOptions(fields: SortFieldDefinition[]): {
  label: string;
  value: string;
}[] {
  return fields.flatMap(({ value, label }) => [
    { label: `${label} (Ascending)`, value },
    { label: `${label} (Descending)`, value: `-${value}` },
  ]);
}

export const LEAD_SORT_FIELDS: SortFieldDefinition[] = [
  { value: 'name', label: 'Name' },
  { value: 'age', label: 'Age' },
  { value: 'value', label: 'Value' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'confidence', label: 'Confidence' },
  { value: 'closedTime', label: 'Closed Time' },
  { value: 'owner', label: 'Owner' },
  { value: 'sources', label: 'Sources' },
];

export const CONTACT_SORT_FIELDS: SortFieldDefinition[] = [
  { value: 'name', label: 'Name' },
  { value: 'createdTime', label: 'Created Time' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'owner', label: 'Owner' },
  { value: 'accountType', label: 'Account Type' },
  { value: 'industry', label: 'Industry' },
  { value: 'territory', label: 'Territory' },
  { value: 'postalCode', label: 'Postal Code' },
  { value: 'lastContactedTime', label: 'Last Contacted Time' },
  { value: 'accounts', label: 'Accounts' },
];

export const ACCOUNT_SORT_FIELDS: SortFieldDefinition[] = [
  { value: 'name', label: 'Name' },
  { value: 'createdTime', label: 'Created Time' },
  { value: 'accountType', label: 'Account Type' },
  { value: 'industry', label: 'Industry' },
  { value: 'territory', label: 'Territory' },
  { value: 'postalCode', label: 'Postal Code' },
  { value: 'phone', label: 'Phone' },
  { value: 'owner', label: 'Owner' },
  { value: 'numberOfContacts', label: 'Number of Contacts' },
  { value: 'lastContactedTime', label: 'Last Contacted Time' },
];
