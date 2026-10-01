import { Property } from '@activepieces/pieces-framework';
import { FormValue } from './client';
import { flowluInput, flowluSharedProps } from './utils';

export const flowluAiProps = {
  task: () => ({
    description: text({
      displayName: 'Description',
      description: 'Task description (plain text).',
      long: true,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Task priority.',
      required: false,
      options: { disabled: false, options: PRIORITY_OPTIONS },
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description:
        'Task type. Leave empty for a regular task (Flowlu default).',
      required: false,
      options: { disabled: false, options: TASK_TYPE_OPTIONS },
    }),
    plan_start_date: Property.DateTime({
      displayName: 'Start Date',
      description:
        'Planned start, ISO 8601 such as "2026-10-01T09:00:00Z". Sent as "YYYY-MM-DD HH:mm:ss" in the Activepieces server time (UTC on Activepieces Cloud); Flowlu reads it in the portal timezone.',
      required: false,
    }),
    deadline: Property.DateTime({
      displayName: 'Deadline',
      description:
        'End date, ISO 8601 such as "2026-10-05T17:00:00Z". Sent as "YYYY-MM-DD HH:mm:ss" in the Activepieces server time (UTC on Activepieces Cloud); Flowlu reads it in the portal timezone.',
      required: false,
    }),
    responsible_id: id({
      displayName: 'Assignee User ID',
      description:
        'User who does the task. Get user IDs from flowlu_list_users.',
    }),
    owner_id: id({
      displayName: 'Owner User ID',
      description:
        'User who owns (set) the task. Get user IDs from flowlu_list_users.',
    }),
    workflow_id: id({
      displayName: 'Workflow ID',
      description:
        'Task workflow. Get IDs from flowlu_list_lookup_values with entity task_workflows.',
    }),
    workflow_stage_id: id({
      displayName: 'Workflow Status ID',
      description:
        'Status within the workflow. Get IDs from flowlu_list_lookup_values with entity task_statuses.',
    }),
    project_id: id({
      displayName: 'Project ID',
      description:
        'Links the task to this project. Get IDs from flowlu_find_projects.',
    }),
    crm_account_id: id({
      displayName: 'CRM Account ID',
      description:
        'Links the task to a CRM contact or organization. Get IDs from flowlu_find_accounts.',
    }),
    parent_id: id({
      displayName: 'Parent Task ID',
      description: 'Makes this a subtask of that task.',
    }),
    deadline_allowchange: flowluSharedProps.triState({
      displayName: 'Assignee Can Change Deadline',
      description:
        'Yes lets the assignee move the deadline. Leave empty to keep the current setting.',
    }),
    task_checkbyowner: flowluSharedProps.triState({
      displayName: 'Needs Owner Approval',
      description:
        'Yes means the owner must approve the task before it is completed. Leave empty to keep the current setting.',
    }),
  }),
  account: () => ({
    name: text({
      displayName: 'Organization Name',
      description: 'Organization name. Required when creating an organization.',
    }),
    name_legal_full: text({
      displayName: 'Full Legal Name',
      description: 'Full legal name of the organization.',
    }),
    honorific_title_id: id({
      displayName: 'Honorific Title ID',
      description:
        'Get IDs from flowlu_list_lookup_values with entity honorific_titles.',
    }),
    first_name: text({
      displayName: 'First Name',
      description: 'Contact first name. Required when creating a contact.',
    }),
    middle_name: text({
      displayName: 'Middle Name',
      description: 'Contact middle name.',
    }),
    last_name: text({
      displayName: 'Last Name',
      description: 'Contact last name.',
    }),
    owner_id: id({
      displayName: 'Owner User ID',
      description:
        'User responsible for the account. Get user IDs from flowlu_list_users.',
    }),
    account_category_id: id({
      displayName: 'Category ID',
      description:
        'Get IDs from flowlu_list_lookup_values with entity account_categories.',
    }),
    industry_id: id({
      displayName: 'Industry ID',
      description:
        'Get IDs from flowlu_list_lookup_values with entity industries.',
    }),
    email: text({
      displayName: 'Email',
      description: 'Main email address, such as "jane@example.com".',
    }),
    phone: text({ displayName: 'Phone', description: 'Main phone number.' }),
    phone2: text({
      displayName: 'Phone 2',
      description: 'Second phone number.',
    }),
    phone3: text({
      displayName: 'Phone 3',
      description: 'Third phone number.',
    }),
    web: text({
      displayName: 'Website',
      description: 'Website URL, such as "https://example.com".',
    }),
    description: text({
      displayName: 'Description',
      description: 'Notes about the account.',
      long: true,
    }),
    vat: text({
      displayName: 'VAT or Tax ID',
      description: 'VAT or tax identification number.',
    }),
    skype: text({ displayName: 'Skype', description: 'Skype name or link.' }),
    telegram: text({
      displayName: 'Telegram',
      description: 'Telegram username.',
    }),
    facebook: text({
      displayName: 'Facebook',
      description: 'Facebook profile link.',
    }),
    x: text({
      displayName: 'X (Twitter)',
      description: 'X / Twitter profile link.',
    }),
    linkedin: text({
      displayName: 'LinkedIn',
      description: 'LinkedIn profile link.',
    }),
    instagram: text({
      displayName: 'Instagram',
      description: 'Instagram profile link.',
    }),
    billing_country: text({
      displayName: 'Billing Country',
      description: 'Billing country.',
    }),
    billing_state: text({
      displayName: 'Billing State',
      description: 'Billing state or region.',
    }),
    billing_city: text({
      displayName: 'Billing City',
      description: 'Billing city.',
    }),
    billing_zip: text({
      displayName: 'Billing Postal Code',
      description: 'Billing postal code.',
    }),
    billing_address_line_1: text({
      displayName: 'Billing Address',
      description: 'Billing street address.',
    }),
    shipping_country: text({
      displayName: 'Shipping Country',
      description: 'Shipping country.',
    }),
    shipping_state: text({
      displayName: 'Shipping State',
      description: 'Shipping state or region.',
    }),
    shipping_city: text({
      displayName: 'Shipping City',
      description: 'Shipping city.',
    }),
    shipping_zip: text({
      displayName: 'Shipping Postal Code',
      description: 'Shipping postal code.',
    }),
    shipping_address_line_1: text({
      displayName: 'Shipping Address',
      description: 'Shipping street address.',
    }),
  }),
  opportunity: () => ({
    budget: Property.Number({
      displayName: 'Amount',
      description: 'Opportunity value in the portal currency, such as 1500.',
      required: false,
    }),
    pipeline_id: id({
      displayName: 'Pipeline ID',
      description:
        'Sales pipeline. Get IDs from flowlu_list_lookup_values with entity pipelines.',
    }),
    pipeline_stage_id: id({
      displayName: 'Pipeline Stage ID',
      description:
        'Stage in the pipeline, checked against it before saving. Creating needs Pipeline ID too; updating without Pipeline ID uses the pipeline the opportunity is already in. Get IDs from flowlu_list_lookup_values with entity pipeline_stages and parent_id = the pipeline ID.',
    }),
    source_id: id({
      displayName: 'Source ID',
      description:
        'Where the opportunity came from. Get IDs from flowlu_list_lookup_values with entity opportunity_sources.',
    }),
    assignee_id: id({
      displayName: 'Assignee User ID',
      description:
        'User responsible for the opportunity. Get user IDs from flowlu_list_users.',
    }),
    start_date: Property.DateTime({
      displayName: 'Start Date',
      description:
        'Start date, such as "2026-10-01". Only the date part is used.',
      required: false,
    }),
    deadline: Property.DateTime({
      displayName: 'Expected Close Date',
      description:
        'Planned close date, such as "2026-11-30". Only the date part is used.',
      required: false,
    }),
    description: text({
      displayName: 'Description',
      description: 'Notes about the opportunity.',
      long: true,
    }),
    contact_name: text({
      displayName: 'Contact Name',
      description:
        'Free-text contact name stored on the opportunity (not a CRM link).',
    }),
    contact_email: text({
      displayName: 'Contact Email',
      description: 'Free-text contact email stored on the opportunity.',
    }),
    contact_phone: text({
      displayName: 'Contact Phone',
      description: 'Free-text contact phone stored on the opportunity.',
    }),
    contact_company: text({
      displayName: 'Contact Company',
      description: 'Free-text company name stored on the opportunity.',
    }),
    contact_position: text({
      displayName: 'Contact Position',
      description: 'Free-text job title stored on the opportunity.',
    }),
  }),
  project: () => ({
    description: text({
      displayName: 'Description',
      description: 'Project description.',
      long: true,
    }),
    manager_id: id({
      displayName: 'Manager User ID',
      description: 'Project manager. Get user IDs from flowlu_list_users.',
    }),
    customer_id: id({
      displayName: 'Customer Organization ID',
      description:
        'CRM organization the project is for. Get IDs from flowlu_find_accounts.',
    }),
    customer_crm_contact_id: id({
      displayName: 'Customer Contact ID',
      description:
        'CRM contact at the customer. Get IDs from flowlu_find_accounts.',
    }),
    crm_lead_id: id({
      displayName: 'Opportunity ID',
      description:
        'CRM opportunity the project came from. Get IDs from flowlu_find_opportunities.',
    }),
    startdate: Property.DateTime({
      displayName: 'Start Date',
      description:
        'Project start, such as "2026-10-01". Only the date part is used.',
      required: false,
    }),
    enddate: Property.DateTime({
      displayName: 'End Date',
      description:
        'Project end, such as "2026-12-31". Only the date part is used.',
      required: false,
    }),
    priority: Property.StaticDropdown({
      displayName: 'Priority',
      description: 'Project priority.',
      required: false,
      options: { disabled: false, options: PRIORITY_OPTIONS },
    }),
    portfolio_id: id({
      displayName: 'Portfolio ID',
      description:
        'Project portfolio. Get IDs from flowlu_list_lookup_values with entity project_portfolios.',
    }),
    tasks_workflow_id: id({
      displayName: 'Task Workflow ID',
      description:
        'Workflow used by tasks in this project. Get IDs from flowlu_list_lookup_values with entity task_workflows.',
    }),
    estimated_revenue: Property.Number({
      displayName: 'Contract Amount',
      description: 'Planned revenue (contract sum).',
      required: false,
    }),
    estimated_expenses: Property.Number({
      displayName: 'Planned Expenses',
      description: 'Planned expense sum.',
      required: false,
    }),
  }),
};

export const flowluAiBody = {
  task: (props: Record<string, unknown>): Record<string, FormValue> => {
    const projectId = flowluInput.optionalId({
      value: props['project_id'],
      name: 'Project ID',
    });
    return flowluInput.compact({
      name: flowluInput.optionalText(props['name']),
      description: flowluInput.optionalText(props['description']),
      priority: flowluInput.oneOf({
        value: props['priority'],
        name: 'Priority',
        allowed: [1, 2, 3],
      }),
      type: flowluInput.oneOf({
        value: props['type'],
        name: 'Type',
        allowed: TASK_TYPE_OPTIONS.map((o) => o.value),
      }),
      status: flowluInput.oneOf({
        value: props['status'],
        name: 'Status',
        allowed: [1, 3, 4, 5],
      }),
      plan_start_date: flowluInput.formatDateTime({
        value: props['plan_start_date'],
        name: 'Start Date',
      }),
      deadline: flowluInput.formatDateTime({
        value: props['deadline'],
        name: 'Deadline',
      }),
      responsible_id: flowluInput.optionalId({
        value: props['responsible_id'],
        name: 'Assignee User ID',
      }),
      owner_id: flowluInput.optionalId({
        value: props['owner_id'],
        name: 'Owner User ID',
      }),
      workflow_id: flowluInput.optionalId({
        value: props['workflow_id'],
        name: 'Workflow ID',
      }),
      workflow_stage_id: flowluInput.optionalId({
        value: props['workflow_stage_id'],
        name: 'Workflow Status ID',
      }),
      module: projectId === undefined ? undefined : 'st',
      model: projectId === undefined ? undefined : 'project',
      model_id: projectId,
      crm_account_id: flowluInput.optionalId({
        value: props['crm_account_id'],
        name: 'CRM Account ID',
      }),
      parent_id: flowluInput.optionalId({
        value: props['parent_id'],
        name: 'Parent Task ID',
      }),
      deadline_allowchange: flowluInput.triStateFlag(
        props['deadline_allowchange']
      ),
      task_checkbyowner: flowluInput.triStateFlag(props['task_checkbyowner']),
    });
  },
  account: (props: Record<string, unknown>): Record<string, FormValue> =>
    flowluInput.compact({
      ...Object.fromEntries(
        ACCOUNT_TEXT_FIELDS.map((field) => [
          ACCOUNT_WIRE_NAMES[field] ?? field,
          flowluInput.optionalText(props[field]),
        ])
      ),
      honorific_title_id: flowluInput.optionalId({
        value: props['honorific_title_id'],
        name: 'Honorific Title ID',
      }),
      owner_id: flowluInput.optionalId({
        value: props['owner_id'],
        name: 'Owner User ID',
      }),
      account_category_id: flowluInput.optionalId({
        value: props['account_category_id'],
        name: 'Category ID',
      }),
      industry_id: flowluInput.optionalId({
        value: props['industry_id'],
        name: 'Industry ID',
      }),
    }),
  opportunity: (props: Record<string, unknown>): Record<string, FormValue> => {
    const pipelineId = flowluInput.optionalId({
      value: props['pipeline_id'],
      name: 'Pipeline ID',
    });
    const stageId = flowluInput.optionalId({
      value: props['pipeline_stage_id'],
      name: 'Pipeline Stage ID',
    });
    return flowluInput.compact({
      name: flowluInput.optionalText(props['name']),
      budget: flowluInput.optionalNumber({
        value: props['budget'],
        name: 'Amount',
      }),
      pipeline_id: pipelineId,
      pipeline_stage_id: stageId,
      source_id: flowluInput.optionalId({
        value: props['source_id'],
        name: 'Source ID',
      }),
      assignee_id: flowluInput.optionalId({
        value: props['assignee_id'],
        name: 'Assignee User ID',
      }),
      start_date: flowluInput.formatDate({
        value: props['start_date'],
        name: 'Start Date',
      }),
      deadline: flowluInput.formatDate({
        value: props['deadline'],
        name: 'Expected Close Date',
      }),
      description: flowluInput.optionalText(props['description']),
      contact_name: flowluInput.optionalText(props['contact_name']),
      contact_email: flowluInput.optionalText(props['contact_email']),
      contact_phone: flowluInput.optionalText(props['contact_phone']),
      contact_company: flowluInput.optionalText(props['contact_company']),
      contact_position: flowluInput.optionalText(props['contact_position']),
    });
  },
  project: (props: Record<string, unknown>): Record<string, FormValue> =>
    flowluInput.compact({
      name: flowluInput.optionalText(props['name']),
      description: flowluInput.optionalText(props['description']),
      manager_id: flowluInput.optionalId({
        value: props['manager_id'],
        name: 'Manager User ID',
      }),
      customer_id: flowluInput.optionalId({
        value: props['customer_id'],
        name: 'Customer Organization ID',
      }),
      customer_crm_contact_id: flowluInput.optionalId({
        value: props['customer_crm_contact_id'],
        name: 'Customer Contact ID',
      }),
      crm_lead_id: flowluInput.optionalId({
        value: props['crm_lead_id'],
        name: 'Opportunity ID',
      }),
      startdate: flowluInput.formatDate({
        value: props['startdate'],
        name: 'Start Date',
      }),
      enddate: flowluInput.formatDate({
        value: props['enddate'],
        name: 'End Date',
      }),
      priority: flowluInput.oneOf({
        value: props['priority'],
        name: 'Priority',
        allowed: [1, 2, 3],
      }),
      project_type_id: flowluInput.optionalId({
        value: props['project_type_id'],
        name: 'Template ID',
      }),
      briefcase_id: flowluInput.optionalId({
        value: props['portfolio_id'],
        name: 'Portfolio ID',
      }),
      tasks_workflow_id: flowluInput.optionalId({
        value: props['tasks_workflow_id'],
        name: 'Task Workflow ID',
      }),
      estimated_revenue: flowluInput.optionalNumber({
        value: props['estimated_revenue'],
        name: 'Contract Amount',
      }),
      estimated_expenses: flowluInput.optionalNumber({
        value: props['estimated_expenses'],
        name: 'Planned Expenses',
      }),
      is_archive: flowluInput.triStateFlag(props['is_archive']),
    }),
};

export const ACCOUNT_WIRE_NAMES: Record<string, string> = {
  vat: 'VAT',
  skype: 'social_network_link_1',
  facebook: 'social_network_link_3',
  x: 'social_network_link_4',
  linkedin: 'social_network_link_5',
  instagram: 'social_network_link_6',
};

function text({
  displayName,
  description,
  long = false,
}: {
  displayName: string;
  description: string;
  long?: boolean;
}) {
  return long
    ? Property.LongText({ displayName, description, required: false })
    : Property.ShortText({ displayName, description, required: false });
}

function id({
  displayName,
  description,
}: {
  displayName: string;
  description: string;
}) {
  return Property.ShortText({
    displayName,
    description: `${description} Numeric ID such as "42".`,
    required: false,
  });
}

const PRIORITY_OPTIONS = [
  { label: 'Low', value: 1 },
  { label: 'Medium', value: 2 },
  { label: 'High', value: 3 },
];

const TASK_TYPE_OPTIONS = [
  { label: 'Task', value: 0 },
  { label: 'Inbox', value: 1 },
  { label: 'Event', value: 20 },
  { label: 'Event: call', value: 21 },
  { label: 'Event: email', value: 22 },
  { label: 'Event: appointment', value: 23 },
  { label: 'Task template', value: 30 },
  { label: 'Milestone', value: 40 },
];

const ACCOUNT_TEXT_FIELDS = [
  'name',
  'name_legal_full',
  'first_name',
  'middle_name',
  'last_name',
  'email',
  'phone',
  'phone2',
  'phone3',
  'web',
  'description',
  'vat',
  'skype',
  'telegram',
  'facebook',
  'x',
  'linkedin',
  'instagram',
  'billing_country',
  'billing_state',
  'billing_city',
  'billing_zip',
  'billing_address_line_1',
  'shipping_country',
  'shipping_state',
  'shipping_city',
  'shipping_zip',
  'shipping_address_line_1',
];
