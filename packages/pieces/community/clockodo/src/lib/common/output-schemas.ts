import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const pagingField: OutputSchemaField = {
  key: 'pagination',
  label: 'Pagination',
  children: [
    { key: 'items_per_page', label: 'Items Per Page', format: 'number' },
    { key: 'current_page', label: 'Current Page', format: 'number' },
    { key: 'count_pages', label: 'Page Count', format: 'number' },
    { key: 'count_items', label: 'Item Count', format: 'number' },
  ],
};

const customerFields: OutputSchemaField[] = [
  { key: 'id', label: 'Customer ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'number', label: 'Number' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'billable_default', label: 'Billable by Default', format: 'boolean' },
  { key: 'note', label: 'Note' },
  { key: 'color', label: 'Color (1-9)', format: 'number' },
];

const projectFields: OutputSchemaField[] = [
  { key: 'id', label: 'Project ID', format: 'number' },
  { key: 'customers_id', label: 'Customer ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'number', label: 'Number' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'billable_default', label: 'Billable by Default', format: 'boolean' },
  { key: 'note', label: 'Note' },
  {
    key: 'budget',
    label: 'Budget',
    children: [
      { key: 'amount', label: 'Amount', format: 'number' },
      { key: 'monetary', label: 'Monetary (false = hours)', format: 'boolean' },
      { key: 'hard', label: 'Hard Budget', format: 'boolean' },
      { key: 'from_subprojects', label: 'From Subprojects', format: 'boolean' },
    ],
  },
  { key: 'completed', label: 'Completed', format: 'boolean' },
  { key: 'billed_completely', label: 'Billed Completely', format: 'boolean', description: 'Usually empty; Clockodo returns it only for some accounts.' },
  { key: 'completed_at', label: 'Completed At', format: 'datetime' },
  { key: 'start_date', label: 'Start Date', format: 'date' },
  { key: 'deadline', label: 'Deadline', format: 'date' },
  { key: 'count_subprojects', label: 'Subproject Count', format: 'number' },
  { key: 'revenue_factor', label: 'Revenue Factor', format: 'number' },
];

const serviceFields: OutputSchemaField[] = [
  { key: 'id', label: 'Service ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'number', label: 'Number' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'note', label: 'Note' },
];

const lumpSumServiceFields: OutputSchemaField[] = [
  { key: 'id', label: 'Lump-Sum Service ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'number', label: 'Number' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'price', label: 'Price', format: 'number' },
  { key: 'unit', label: 'Unit' },
  { key: 'note', label: 'Note' },
];

const subprojectFields: OutputSchemaField[] = [
  { key: 'id', label: 'Subproject ID', format: 'number' },
  { key: 'projects_id', label: 'Project ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'number', label: 'Number' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'completed', label: 'Completed', format: 'boolean' },
];

const userFields: OutputSchemaField[] = [
  { key: 'id', label: 'User ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'number', label: 'Number' },
  { key: 'initials', label: 'Initials' },
  { key: 'email', label: 'E-Mail', format: 'email' },
  { key: 'start_date', label: 'Start Date', format: 'date' },
  { key: 'role', label: 'Role' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'language', label: 'Language' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'wage_type', label: 'Wage Type', format: 'number' },
  { key: 'teams_id', label: 'Team ID', format: 'number' },
  { key: 'can_generally_see_absences', label: 'Can See Absences', format: 'boolean' },
  { key: 'can_generally_manage_absences', label: 'Can Manage Absences', format: 'boolean' },
  { key: 'can_add_customers', label: 'Can Add Customers', format: 'boolean' },
];

const teamFields: OutputSchemaField[] = [
  { key: 'id', label: 'Team ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'leader', label: 'Leader User ID', format: 'number' },
  { key: 'user_ids', label: 'Member User IDs' },
];

const entryFields: OutputSchemaField[] = [
  { key: 'id', label: 'Entry ID', format: 'number' },
  { key: 'type', label: 'Type', format: 'number' },
  { key: 'customers_id', label: 'Customer ID', format: 'number' },
  { key: 'projects_id', label: 'Project ID', format: 'number' },
  { key: 'subprojects_id', label: 'Subproject ID', format: 'number' },
  { key: 'services_id', label: 'Service ID', format: 'number' },
  { key: 'users_id', label: 'User ID', format: 'number' },
  { key: 'clocked', label: 'Clocked (stopwatch)', format: 'boolean' },
  { key: 'time_clocked_since', label: 'Clocked Since', format: 'datetime' },
  { key: 'texts_id', label: 'Text ID', format: 'number' },
  { key: 'billable', label: 'Billable (0 no, 1 yes, 2 billed)', format: 'number' },
  { key: 'text', label: 'Description' },
  { key: 'time_since', label: 'Start Time', format: 'datetime' },
  { key: 'time_until', label: 'End Time', format: 'datetime' },
  { key: 'duration', label: 'Duration (seconds)', format: 'number' },
  { key: 'hourly_rate', label: 'Hourly Rate', format: 'number' },
  { key: 'time_insert', label: 'Created At', format: 'datetime' },
  { key: 'time_last_change', label: 'Last Changed At', format: 'datetime' },
];

const absenceFields: OutputSchemaField[] = [
  { key: 'id', label: 'Absence ID', format: 'number' },
  { key: 'users_id', label: 'User ID', format: 'number' },
  { key: 'date_since', label: 'Start Date', format: 'date' },
  { key: 'date_until', label: 'End Date', format: 'date' },
  { key: 'status', label: 'Status (0 requested, 1 approved, 2 declined, 3/4 cancelled)', format: 'number' },
  {
    key: 'type',
    label: 'Type',
    format: 'number',
    description: 'Absence type: 1 regular holiday, 2 special leave, 3 reduction of overtime, 4 sick day, 5 sick day of a child, 6 school / further education, 7 maternity protection, 8 home office, 9 work out of office, 10 unpaid special leave, 11 unpaid sick day, 12 unpaid sick day of a child, 13 quarantine, 14 military / alternative service, 15 sick day (sickness benefit).',
  },
  { key: 'note', label: 'Note' },
  { key: 'public_note', label: 'Public Note' },
  { key: 'half_day', label: 'Half Day', format: 'boolean' },
  { key: 'count_days', label: 'Days', format: 'number' },
  { key: 'count_hours', label: 'Hours', format: 'number' },
  { key: 'sick_note', label: 'Sick Note', format: 'boolean' },
  { key: 'date_enquired', label: 'Requested On', format: 'date' },
  { key: 'date_approved', label: 'Approved On', format: 'date' },
  { key: 'approved_by', label: 'Approved By User ID', format: 'number' },
];

const enhancedEntryFields: OutputSchemaField[] = [
  ...entryFields,
  { key: 'customers_name', label: 'Customer Name (Enhanced List only)', description: 'Returned only when Enhanced List is on (Enhanced List only).' },
  { key: 'projects_name', label: 'Project Name (Enhanced List only)', description: 'Returned only when Enhanced List is on (Enhanced List only).' },
  { key: 'services_name', label: 'Service Name (Enhanced List only)', description: 'Returned only when Enhanced List is on (Enhanced List only).' },
  { key: 'users_name', label: 'User Name (Enhanced List only)', description: 'Returned only when Enhanced List is on (Enhanced List only).' },
];

function listOf({
  key,
  label,
  fields,
  labelKey,
  paged,
}: {
  key: string;
  label: string;
  fields: OutputSchemaField[];
  labelKey?: string;
  paged?: boolean;
}): OutputSchema {
  const list: OutputSchemaField = { key, label, listItems: fields, labelKey };
  return { fields: paged ? [list, pagingField] : [list] };
}

export const clockodoOutputSchemas: Record<string, OutputSchema> = {
  customer: { fields: customerFields },
  project: { fields: projectFields },
  service: { fields: serviceFields },
  user: { fields: userFields },
  team: { fields: teamFields },
  entry: { fields: entryFields },
  absence: { fields: absenceFields },
  deleted: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'id', label: 'Deleted ID', format: 'number' },
    ],
  },
  customers: listOf({ key: 'customers', label: 'Customers', fields: customerFields, labelKey: 'name', paged: true }),
  projects: listOf({ key: 'projects', label: 'Projects', fields: projectFields, labelKey: 'name', paged: true }),
  services: listOf({ key: 'services', label: 'Services', fields: serviceFields, labelKey: 'name' }),
  users: listOf({ key: 'users', label: 'Users', fields: userFields, labelKey: 'name' }),
  teams: listOf({ key: 'teams', label: 'Teams', fields: teamFields, labelKey: 'name' }),
  entries: listOf({ key: 'entries', label: 'Entries', fields: enhancedEntryFields, labelKey: 'text', paged: true }),
  absences: listOf({ key: 'absences', label: 'Absences', fields: absenceFields, labelKey: 'date_since' }),
  lumpSumServices: listOf({
    key: 'lump_sum_services',
    label: 'Lump-Sum Services',
    fields: lumpSumServiceFields,
    labelKey: 'name',
  }),
  subprojects: listOf({ key: 'subprojects', label: 'Subprojects', fields: subprojectFields, labelKey: 'name' }),
  runningClock: {
    fields: [{ key: 'running', label: 'Running Entry', children: entryFields }],
  },
};
