import {
  OutputSchema,
  OutputSchemaField,
} from '@activepieces/pieces-framework';

const PORTAL_TIME =
  'Portal time zone, formatted YYYY-MM-DD HH:mm:ss. Empty when not set.';

const taskFields: OutputSchemaField[] = [
  {
    key: 'id',
    label: 'Task ID',
    description: 'Use this to get, update or delete the task in a later step.',
  },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  {
    key: 'status',
    label: 'Status',
    description: '1 new, 3 in progress, 4 pending owner approval, 5 completed.',
  },
  {
    key: 'priority',
    label: 'Priority',
    description: '1 low, 2 medium, 3 high.',
  },
  {
    key: 'type',
    label: 'Type',
    description: '0 task, 1 inbox, 20-23 event, 30 template, 40 milestone.',
  },
  { key: 'responsible_id', label: 'Assignee User ID' },
  { key: 'owner_id', label: 'Owner User ID' },
  { key: 'plan_start_date', label: 'Start Date', description: PORTAL_TIME },
  { key: 'deadline', label: 'Deadline', description: PORTAL_TIME },
  { key: 'start_date', label: 'Started At', description: PORTAL_TIME },
  { key: 'closed_date', label: 'Completed At', description: PORTAL_TIME },
  { key: 'workflow_id', label: 'Workflow ID' },
  { key: 'workflow_stage_id', label: 'Workflow Status ID' },
  {
    key: 'module',
    label: 'Linked Module',
    description: '"st" when the task belongs to a project.',
  },
  {
    key: 'model',
    label: 'Linked Object Type',
    description: '"project" when the task belongs to a project.',
  },
  {
    key: 'model_id',
    label: 'Linked Object ID',
    description: 'The project ID when the task belongs to a project.',
  },
  { key: 'crm_account_id', label: 'CRM Account ID' },
  { key: 'parent_id', label: 'Parent Task ID' },
  {
    key: 'deadline_allowchange',
    label: 'Assignee Can Change Deadline',
    description: '1 yes, 0 no.',
  },
  {
    key: 'task_checkbyowner',
    label: 'Needs Owner Approval',
    description: '1 yes, 0 no.',
  },
  { key: 'time_estimate', label: 'Estimated Time' },
  { key: 'time_spent', label: 'Time Spent' },
  { key: 'created_date', label: 'Created At', description: PORTAL_TIME },
  { key: 'updated_date', label: 'Updated At', description: PORTAL_TIME },
];

function accountFieldsWith({
  vatKey,
}: {
  vatKey: string;
}): OutputSchemaField[] {
  return [
    {
      key: 'id',
      label: 'Account ID',
      description:
        'Use this to get, update, link or delete the account in a later step.',
    },
    {
      key: 'type',
      label: 'Account Type',
      description: '1 organization, 2 contact.',
    },
    { key: 'name', label: 'Name' },
    { key: 'first_name', label: 'First Name' },
    { key: 'middle_name', label: 'Middle Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'name_legal_full', label: 'Full Legal Name' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'phone', label: 'Phone' },
    { key: 'phone2', label: 'Phone 2' },
    { key: 'phone3', label: 'Phone 3' },
    { key: 'web', label: 'Website', format: 'url' },
    { key: 'owner_id', label: 'Owner User ID' },
    { key: 'account_category_id', label: 'Category ID' },
    { key: 'industry_id', label: 'Industry ID' },
    { key: 'honorific_title_id', label: 'Honorific Title ID' },
    { key: vatKey, label: 'VAT or Tax ID' },
    { key: 'description', label: 'Description' },
    { key: 'telegram', label: 'Telegram' },
    { key: 'social_network_link_1', label: 'Skype' },
    { key: 'social_network_link_3', label: 'Facebook', format: 'url' },
    { key: 'social_network_link_4', label: 'X (Twitter)', format: 'url' },
    { key: 'social_network_link_5', label: 'LinkedIn', format: 'url' },
    { key: 'social_network_link_6', label: 'Instagram', format: 'url' },
    { key: 'billing_country', label: 'Billing Country' },
    { key: 'billing_state', label: 'Billing State' },
    { key: 'billing_city', label: 'Billing City' },
    { key: 'billing_zip', label: 'Billing Postal Code' },
    { key: 'billing_address_line_1', label: 'Billing Address' },
    { key: 'shipping_country', label: 'Shipping Country' },
    { key: 'shipping_city', label: 'Shipping City' },
    { key: 'shipping_address_line_1', label: 'Shipping Address' },
    { key: 'active', label: 'Active', description: '1 active, 0 inactive.' },
    { key: 'created_date', label: 'Created At', description: PORTAL_TIME },
    { key: 'updated_date', label: 'Updated At', description: PORTAL_TIME },
  ];
}

const accountFields = accountFieldsWith({ vatKey: 'vat' });
const accountListFields = accountFieldsWith({ vatKey: 'VAT' });

const opportunityFields: OutputSchemaField[] = [
  {
    key: 'id',
    label: 'Opportunity ID',
    description:
      'Use this to get, update, link or delete the opportunity in a later step.',
  },
  { key: 'name', label: 'Name' },
  { key: 'budget', label: 'Amount', format: 'number' },
  {
    key: 'active',
    label: 'Status',
    description: '1 in progress, 2 lost, 3 won.',
  },
  { key: 'pipeline_id', label: 'Pipeline ID' },
  { key: 'pipeline_stage_id', label: 'Pipeline Stage ID' },
  { key: 'source_id', label: 'Source ID' },
  { key: 'assignee_id', label: 'Assignee User ID' },
  { key: 'start_date', label: 'Start Date', format: 'date' },
  { key: 'deadline', label: 'Expected Close Date', format: 'date' },
  { key: 'closing_date', label: 'Close Date', format: 'date' },
  { key: 'closing_status_id', label: 'Loss Reason ID' },
  { key: 'closing_comment', label: 'Closing Comment' },
  { key: 'description', label: 'Description' },
  { key: 'contact_name', label: 'Contact Name' },
  { key: 'contact_email', label: 'Contact Email', format: 'email' },
  { key: 'contact_phone', label: 'Contact Phone' },
  { key: 'contact_company', label: 'Contact Company' },
  { key: 'contact_position', label: 'Contact Position' },
  { key: 'created_date', label: 'Created At', description: PORTAL_TIME },
  { key: 'updated_date', label: 'Updated At', description: PORTAL_TIME },
];

const projectFields: OutputSchemaField[] = [
  {
    key: 'id',
    label: 'Project ID',
    description:
      'Use this to get or update the project, or to add tasks to it, in a later step.',
  },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'manager_id', label: 'Manager User ID' },
  { key: 'customer_id', label: 'Customer Organization ID' },
  { key: 'customer_crm_contact_id', label: 'Customer Contact ID' },
  { key: 'crm_lead_id', label: 'Opportunity ID' },
  { key: 'project_type_id', label: 'Template ID' },
  { key: 'briefcase_id', label: 'Portfolio ID' },
  { key: 'tasks_workflow_id', label: 'Task Workflow ID' },
  {
    key: 'priority',
    label: 'Priority',
    description: '1 low, 2 medium, 3 high.',
  },
  { key: 'startdate', label: 'Start Date', format: 'date' },
  { key: 'enddate', label: 'End Date', format: 'date' },
  { key: 'estimated_revenue', label: 'Contract Amount', format: 'number' },
  { key: 'estimated_expenses', label: 'Planned Expenses', format: 'number' },
  {
    key: 'is_archive',
    label: 'Archived',
    description: '1 archived, 0 not archived.',
  },
  { key: 'created_date', label: 'Created At', description: PORTAL_TIME },
  { key: 'updated_date', label: 'Updated At', description: PORTAL_TIME },
];

const userFields: OutputSchemaField[] = [
  {
    key: 'id',
    label: 'User ID',
    description: 'Use this as an assignee, owner or manager ID.',
  },
  { key: 'name', label: 'Name' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'username', label: 'Login Email', format: 'email' },
  { key: 'position', label: 'Position' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'role_admin', label: 'Administrator', description: '1 yes, 0 no.' },
  { key: 'role_login', label: 'Can Log In', description: '1 yes, 0 no.' },
  {
    key: 'last_active',
    label: 'Last Active',
    description: 'Unix time in seconds.',
  },
];

const linkFields: OutputSchemaField[] = [
  { key: 'id', label: 'Link ID' },
  { key: 'lead_id', label: 'Opportunity ID' },
  { key: 'account_id', label: 'Account ID' },
  {
    key: 'account_type',
    label: 'Account Type',
    description: '1 organization, 2 contact.',
  },
  {
    key: 'already_linked',
    label: 'Already Linked',
    format: 'boolean',
    description: 'True when the link existed before this step.',
  },
];

const linkReportFields: OutputSchemaField[] = [
  {
    key: 'linked_accounts',
    label: 'Linked Accounts',
    labelKey: 'account_id',
    description:
      'Accounts linked to the opportunity. On Create/Update Opportunity only present when Customer or Contact is set.',
    listItems: linkFields,
  },
  {
    key: 'link_errors',
    label: 'Link Errors',
    labelKey: 'account_id',
    description:
      'Accounts that could not be linked. The opportunity itself was saved.',
    listItems: [
      { key: 'account_id', label: 'Account ID' },
      { key: 'error', label: 'Error' },
    ],
  },
];

const readBackField: OutputSchemaField = {
  key: 'read_back_error',
  label: 'Read-back Error',
  description:
    'Empty unless the record was created but reading it back failed; the record exists either way.',
};

function listOf({
  fields,
  label,
}: {
  fields: OutputSchemaField[];
  label: string;
}): OutputSchema {
  return {
    fields: [
      { key: 'items', label, labelKey: 'name', listItems: fields },
      { key: 'page', label: 'Page', format: 'number' },
      {
        key: 'count',
        label: 'Returned',
        format: 'number',
        description: 'Records on this page.',
      },
      { key: 'total', label: 'Total Matches', format: 'number' },
      {
        key: 'has_more',
        label: 'Has More',
        format: 'boolean',
        description: 'True when another page exists.',
      },
    ],
  };
}

function envelope({
  fields,
  label,
  extra = [],
}: {
  fields: OutputSchemaField[];
  label: string;
  extra?: OutputSchemaField[];
}): OutputSchema {
  return { fields: [{ key: 'response', label, children: fields }, ...extra] };
}

export const taskOutputSchema: OutputSchema = { fields: taskFields };
export const accountOutputSchema: OutputSchema = { fields: accountFields };
export const accountTriggerOutputSchema: OutputSchema = {
  fields: accountListFields,
};
export const opportunityOutputSchema: OutputSchema = {
  fields: opportunityFields,
};
export const opportunityCreateOutputSchema: OutputSchema = {
  fields: [...opportunityFields, readBackField, ...linkReportFields],
};
export const projectOutputSchema: OutputSchema = { fields: projectFields };
export const taskCreateOutputSchema: OutputSchema = {
  fields: [...taskFields, readBackField],
};
export const accountCreateOutputSchema: OutputSchema = {
  fields: [...accountFields, readBackField],
};
export const projectCreateOutputSchema: OutputSchema = {
  fields: [...projectFields, readBackField],
};
export const linkOutputSchema: OutputSchema = { fields: linkFields };

export const deletedOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Deleted ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const taskListOutputSchema = listOf({
  fields: taskFields,
  label: 'Tasks',
});
export const accountListOutputSchema = listOf({
  fields: accountListFields,
  label: 'Accounts',
});
export const opportunityListOutputSchema = listOf({
  fields: opportunityFields,
  label: 'Opportunities',
});
export const projectListOutputSchema = listOf({
  fields: projectFields,
  label: 'Projects',
});
export const userListOutputSchema = listOf({
  fields: userFields,
  label: 'Users',
});

export const lookupOutputSchema: OutputSchema = {
  fields: [
    { key: 'entity', label: 'Values' },
    {
      key: 'items',
      label: 'Values',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        {
          key: 'parent_id',
          label: 'Parent ID',
          description: 'Pipeline ID for stages, workflow ID for task statuses.',
        },
        { key: 'active', label: 'Active' },
      ],
    },
    { key: 'count', label: 'Returned', format: 'number' },
    { key: 'total', label: 'Total', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
  ],
};

export const taskEnvelopeOutputSchema = envelope({
  fields: taskFields,
  label: 'Task',
});
export const accountEnvelopeOutputSchema = envelope({
  fields: accountFields,
  label: 'Account',
});
export const opportunityEnvelopeOutputSchema = envelope({
  fields: opportunityFields,
  label: 'Opportunity',
  extra: linkReportFields,
});
export const deletedEnvelopeOutputSchema = envelope({
  fields: [{ key: 'id', label: 'Deleted ID' }],
  label: 'Deleted Record',
});
