import { OutputSchema } from '@activepieces/pieces-framework';

export const contactFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Contact ID' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'emails', label: 'Emails', labelKey: 'value', listItems: [
    { key: 'value', label: 'Email', format: 'email' },
    { key: 'is_primary', label: 'Is Primary', format: 'boolean' },
  ] },
  { key: 'mobile_number', label: 'Mobile Number' },
  { key: 'work_number', label: 'Work Number' },
  { key: 'job_title', label: 'Job Title' },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
  { key: 'owner_id', label: 'Owner ID' },
  { key: 'territory_id', label: 'Territory ID' },
  { key: 'contact_status_id', label: 'Contact Status ID' },
  { key: 'lifecycle_stage_id', label: 'Lifecycle Stage ID' },
  { key: 'sales_account_id', label: 'Primary Account ID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'custom_field', label: 'Custom Fields', dynamicKey: true },
];

export const accountFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Account ID' },
  { key: 'name', label: 'Name' },
  { key: 'website', label: 'Website', format: 'url' },
  { key: 'phone', label: 'Phone' },
  { key: 'city', label: 'City' },
  { key: 'country', label: 'Country' },
  { key: 'owner_id', label: 'Owner ID' },
  { key: 'industry_type_id', label: 'Industry Type ID' },
  { key: 'annual_revenue', label: 'Annual Revenue', format: 'number' },
  { key: 'number_of_employees', label: 'Number of Employees', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'custom_field', label: 'Custom Fields', dynamicKey: true },
];

export const dealFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Deal ID' },
  { key: 'name', label: 'Name' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'currency_id', label: 'Currency ID' },
  { key: 'deal_pipeline_id', label: 'Pipeline ID' },
  { key: 'deal_stage_id', label: 'Stage ID' },
  { key: 'sales_account_id', label: 'Account ID' },
  { key: 'owner_id', label: 'Owner ID' },
  { key: 'expected_close', label: 'Expected Close', format: 'date' },
  { key: 'probability', label: 'Probability', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'custom_field', label: 'Custom Fields', dynamicKey: true },
];

export const taskFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Task ID' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'due_date', label: 'Due Date', format: 'datetime' },
  { key: 'status', label: 'Status (0 open, 1 done)', format: 'number' },
  { key: 'owner_id', label: 'Owner ID' },
  { key: 'targetable_type', label: 'Related Type' },
  { key: 'targetable_id', label: 'Related Record ID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

export const searchResultFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'type', label: 'Type' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
];

export const deletedFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'deleted', label: 'Deleted', format: 'boolean' },
];

export const contactOutputSchema: OutputSchema = { fields: contactFields };

export const createContactOutputSchema: OutputSchema = {
  fields: [
    ...contactFields,
    { key: 'contact', label: 'Contact (legacy)', children: contactFields },
  ],
};

export const getContactOutputSchema: OutputSchema = {
  fields: [
    ...contactFields,
    { key: 'sales_accounts', label: 'Accounts', labelKey: 'name', listItems: [
      { key: 'id', label: 'Account ID' },
      { key: 'name', label: 'Name' },
      { key: 'is_primary', label: 'Is Primary', format: 'boolean' },
    ] },
  ],
};

export const findContactOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'contact', label: 'Contact', children: contactFields },
  ],
};

export const accountOutputSchema: OutputSchema = { fields: accountFields };

export const findAccountOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'accounts', label: 'Accounts', labelKey: 'name', listItems: accountFields },
  ],
};

export const dealOutputSchema: OutputSchema = { fields: dealFields };

export const deleteOutputSchema: OutputSchema = { fields: deletedFields };

export const searchRecordsOutputSchema: OutputSchema = {
  fields: [
    { key: 'results', label: 'Results', labelKey: 'name', listItems: searchResultFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listRecordsOutputSchema: OutputSchema = {
  fields: [
    { key: 'records', label: 'Records', labelKey: 'id', listItems: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'display_name', label: 'Display Name' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
      { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    ] },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'total', label: 'Total', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
  ],
};

export const taskOutputSchema: OutputSchema = { fields: taskFields };

export const listTasksOutputSchema: OutputSchema = {
  fields: [
    { key: 'tasks', label: 'Tasks', labelKey: 'title', listItems: taskFields },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
  ],
};

export const noteOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Note ID' },
    { key: 'description', label: 'Description' },
    { key: 'targetable_type', label: 'Related Type' },
    { key: 'targetable_id', label: 'Related Record ID' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ],
};

export const appointmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Appointment ID' },
    { key: 'title', label: 'Title' },
    { key: 'from_date', label: 'Start', format: 'datetime' },
    { key: 'end_date', label: 'End', format: 'datetime' },
    { key: 'location', label: 'Location' },
    { key: 'is_allday', label: 'All Day', format: 'boolean' },
    { key: 'targetable_type', label: 'Related Type' },
    { key: 'targetable_id', label: 'Related Record ID' },
  ],
};

export const salesActivityOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Activity ID' },
    { key: 'title', label: 'Title' },
    { key: 'sales_activity_type_id', label: 'Activity Type ID' },
    { key: 'start_date', label: 'Start', format: 'datetime' },
    { key: 'end_date', label: 'End', format: 'datetime' },
    { key: 'owner_id', label: 'Owner ID' },
    { key: 'targetable_type', label: 'Related Type' },
    { key: 'targetable_id', label: 'Related Record ID' },
  ],
};

export const listUsersOutputSchema: OutputSchema = {
  fields: [
    { key: 'users', label: 'Users', labelKey: 'name', listItems: [
      { key: 'id', label: 'User ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email', format: 'email' },
    ] },
  ],
};

export const listPipelinesOutputSchema: OutputSchema = {
  fields: [
    { key: 'pipelines', label: 'Pipelines', labelKey: 'name', listItems: [
      { key: 'id', label: 'Pipeline ID' },
      { key: 'name', label: 'Name' },
      { key: 'stages', label: 'Stages', labelKey: 'name', listItems: [
        { key: 'id', label: 'Stage ID' },
        { key: 'name', label: 'Name' },
        { key: 'position', label: 'Position', format: 'number' },
      ] },
    ] },
  ],
};

export const listFieldOptionsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Options', labelKey: 'name', listItems: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ] },
  ],
};

export const customFieldsOutputSchema: OutputSchema = {
  fields: [
    { key: 'fields', label: 'Fields', labelKey: 'label', listItems: [
      { key: 'name', label: 'API Name' },
      { key: 'label', label: 'Label' },
      { key: 'type', label: 'Type' },
      { key: 'required', label: 'Required', format: 'boolean' },
      { key: 'is_custom', label: 'Is Custom', format: 'boolean' },
      { key: 'choices', label: 'Choices', labelKey: 'value', listItems: [
        { key: 'id', label: 'Choice ID' },
        { key: 'value', label: 'Value' },
      ] },
    ] },
  ],
};

export const filteredSearchOutputSchema: OutputSchema = {
  fields: [
    { key: 'records', label: 'Records', labelKey: 'id', listItems: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'display_name', label: 'Display Name' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
      { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    ] },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'total', label: 'Total', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
  ],
};

export const marketingListUpdateOutputSchema: OutputSchema = {
  fields: [
    { key: 'list_id', label: 'List ID' },
    { key: 'contact_ids', label: 'Contact IDs' },
    { key: 'message', label: 'Message' },
  ],
};
