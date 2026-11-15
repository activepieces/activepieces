import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const timestamps: OutputSchemaField[] = [
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const customFields: OutputSchemaField = { key: 'fields', label: 'Custom Fields', dynamicKey: true };

const contactFields: OutputSchemaField[] = [
  { key: 'id', label: 'Contact ID' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'status', label: 'Status' },
  { key: 'owner_id', label: 'Owner ID' },
  { key: 'assigned_to', label: 'Assigned To (Member ID)' },
  { key: 'company_id', label: 'Company ID' },
  { key: 'slug', label: 'Slug' },
  customFields,
  ...timestamps,
];

const companyFields: OutputSchemaField[] = [
  { key: 'id', label: 'Company ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'website', label: 'Website' },
  { key: 'industry', label: 'Industry' },
  { key: 'status', label: 'Status' },
  { key: 'owner_id', label: 'Owner ID' },
  { key: 'is_archived', label: 'Archived', format: 'boolean' },
  { key: 'slug', label: 'Slug' },
  customFields,
  ...timestamps,
];

const dealFields: OutputSchemaField[] = [
  { key: 'id', label: 'Deal ID' },
  { key: 'name', label: 'Name' },
  { key: 'value', label: 'Value', format: 'number' },
  { key: 'status', label: 'Status' },
  { key: 'owner_id', label: 'Owner ID' },
  { key: 'contact_id', label: 'Contact ID' },
  { key: 'company_id', label: 'Company ID' },
  customFields,
  ...timestamps,
];

const productFields: OutputSchemaField[] = [
  { key: 'id', label: 'Product ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'sku', label: 'SKU' },
  { key: 'price', label: 'Price', format: 'number' },
  { key: 'cost', label: 'Cost', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'status', label: 'Status' },
  { key: 'category', label: 'Category' },
  { key: 'product_type', label: 'Product Type' },
  { key: 'image_url', label: 'Image URL', format: 'url' },
  ...timestamps,
];

const budgetFields: OutputSchemaField[] = [
  { key: 'id', label: 'Budget ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'category', label: 'Category' },
  { key: 'period', label: 'Period' },
  { key: 'allocated_amount', label: 'Allocated Amount', format: 'number' },
  { key: 'spent_amount', label: 'Spent Amount', format: 'number' },
  { key: 'remaining_amount', label: 'Remaining Amount', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'status', label: 'Status' },
  { key: 'start_date', label: 'Start Date', format: 'date' },
  { key: 'end_date', label: 'End Date', format: 'date' },
  ...timestamps,
];

const budgetExpenseFields: OutputSchemaField[] = [
  { key: 'id', label: 'Expense ID' },
  { key: 'budget_id', label: 'Budget ID' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'category', label: 'Category' },
  { key: 'date', label: 'Date', format: 'date' },
  ...timestamps,
];

const projectFields: OutputSchemaField[] = [
  { key: 'id', label: 'Project ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'progress', label: 'Progress', format: 'number' },
  { key: 'total_tasks', label: 'Total Tasks', format: 'number' },
  { key: 'completed_tasks', label: 'Completed Tasks', format: 'number' },
  { key: 'due_date', label: 'Due Date', format: 'date' },
  { key: 'team', label: 'Team' },
  { key: 'tags', label: 'Tags' },
  ...timestamps,
];

const taskFields: OutputSchemaField[] = [
  { key: 'id', label: 'Task ID' },
  { key: 'project_id', label: 'Project ID' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
  { key: 'assignee_id', label: 'Assignee ID' },
  { key: 'due_date', label: 'Due Date', format: 'date' },
  { key: 'parent_id', label: 'Parent Task ID' },
  { key: 'estimated_hours', label: 'Estimated Hours', format: 'number' },
  { key: 'level', label: 'Level', format: 'number' },
  { key: 'has_children', label: 'Has Subtasks', format: 'boolean' },
  { key: 'tags', label: 'Tags' },
  ...timestamps,
];

const stageFields: OutputSchemaField[] = [
  { key: 'id', label: 'Stage ID' },
  { key: 'name', label: 'Name' },
  { key: 'color', label: 'Color' },
];

const pipelineFields: OutputSchemaField[] = [
  { key: 'id', label: 'Pipeline ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'pipeline_type', label: 'Pipeline Type' },
  { key: 'stages', label: 'Stages', labelKey: 'name', listItems: stageFields },
  { key: 'slug', label: 'Slug' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  ...timestamps,
];

const pipelineItemFields: OutputSchemaField[] = [
  { key: 'id', label: 'Item ID' },
  { key: 'title', label: 'Title' },
  { key: 'subtitle', label: 'Subtitle' },
  { key: 'description', label: 'Description' },
  { key: 'stage_id', label: 'Stage ID' },
  { key: 'item_type', label: 'Item Type' },
  { key: 'priority', label: 'Priority' },
  { key: 'value', label: 'Value', format: 'number' },
  { key: 'assigned_to', label: 'Assigned To (Member ID)' },
  { key: 'due_date', label: 'Due Date', format: 'date' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'company', label: 'Company' },
  { key: 'tags', label: 'Tags' },
  ...timestamps,
];

const orderFields: OutputSchemaField[] = [
  { key: 'id', label: 'Order ID' },
  { key: 'order_number', label: 'Order Number' },
  { key: 'customer_name', label: 'Customer Name' },
  { key: 'customer_email', label: 'Customer Email', format: 'email' },
  { key: 'customer_company', label: 'Customer Company' },
  { key: 'contact_id', label: 'Contact ID' },
  { key: 'total_amount', label: 'Total Amount', format: 'number' },
  { key: 'status', label: 'Status' },
  { key: 'payment_status', label: 'Payment Status' },
  { key: 'order_date', label: 'Order Date', format: 'date' },
  { key: 'delivery_date', label: 'Delivery Date', format: 'date' },
  { key: 'priority', label: 'Priority' },
  { key: 'tracking_number', label: 'Tracking Number' },
  { key: 'notes', label: 'Notes' },
  ...timestamps,
];

const activityFields: OutputSchemaField[] = [
  { key: 'id', label: 'Activity ID' },
  { key: 'contact_id', label: 'Contact ID' },
  { key: 'type', label: 'Type' },
  { key: 'title', label: 'Title' },
  { key: 'date', label: 'Date', format: 'datetime' },
  { key: 'data', label: 'Details', dynamicKey: true },
  ...timestamps,
];

const memberFields: OutputSchemaField[] = [
  { key: 'account_id', label: 'Member ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'full_name', label: 'Full Name' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'role', label: 'Role' },
  { key: 'joined_at', label: 'Joined At', format: 'datetime' },
];

function listSchema({ itemFields, labelKey }: { itemFields: OutputSchemaField[]; labelKey: string }): OutputSchema {
  return {
    fields: [
      { key: 'items', label: 'Items', labelKey, listItems: itemFields },
      { key: 'count', label: 'Returned', format: 'number' },
      { key: 'total', label: 'Total Matching', format: 'number' },
      { key: 'hasMore', label: 'Has More', format: 'boolean' },
      { key: 'nextPage', label: 'Next Page', format: 'number' },
    ],
  };
}

function recordSchema(fields: OutputSchemaField[]): OutputSchema {
  return { fields };
}

const deleteSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'id', label: 'Deleted ID' },
    { key: 'name', label: 'Name' },
    { key: 'message', label: 'Message' },
  ],
};

export const ninjapipeSchemas = {
  contact: recordSchema(contactFields),
  contactList: listSchema({ itemFields: contactFields, labelKey: 'email' }),
  contactWithAction: recordSchema([
    { key: 'action', label: 'Action (created, updated, existing or skipped)' },
    ...contactFields,
  ]),
  company: recordSchema(companyFields),
  companyList: listSchema({ itemFields: companyFields, labelKey: 'name' }),
  deal: recordSchema(dealFields),
  dealList: listSchema({ itemFields: dealFields, labelKey: 'name' }),
  product: recordSchema(productFields),
  productList: listSchema({ itemFields: productFields, labelKey: 'name' }),
  budget: recordSchema(budgetFields),
  budgetList: listSchema({ itemFields: budgetFields, labelKey: 'name' }),
  budgetExpense: recordSchema(budgetExpenseFields),
  project: recordSchema(projectFields),
  projectList: listSchema({ itemFields: projectFields, labelKey: 'name' }),
  task: recordSchema(taskFields),
  taskList: recordSchema([
    { key: 'items', label: 'Tasks', labelKey: 'title', listItems: taskFields },
    { key: 'count', label: 'Returned', format: 'number' },
  ]),
  pipeline: recordSchema(pipelineFields),
  pipelineList: listSchema({ itemFields: pipelineFields, labelKey: 'name' }),
  pipelineItem: recordSchema(pipelineItemFields),
  pipelineItemList: recordSchema([
    { key: 'items', label: 'Items', labelKey: 'title', listItems: pipelineItemFields },
    { key: 'count', label: 'Returned', format: 'number' },
  ]),
  order: recordSchema(orderFields),
  orderList: listSchema({ itemFields: orderFields, labelKey: 'order_number' }),
  activity: recordSchema(activityFields),
  activityList: listSchema({ itemFields: activityFields, labelKey: 'title' }),
  memberList: recordSchema([
    { key: 'items', label: 'Members', labelKey: 'email', listItems: memberFields },
    { key: 'count', label: 'Returned', format: 'number' },
  ]),
  listMember: recordSchema([
    { key: 'list_id', label: 'List ID' },
    { key: 'list_member_id', label: 'List Member ID' },
    { key: 'member_type', label: 'Member Type' },
    { key: 'member_id', label: 'Member ID' },
    { key: 'added_at', label: 'Added At', format: 'datetime' },
    { key: 'already_in_list', label: 'Already In List', format: 'boolean' },
  ]),
  clientPortal: recordSchema([
    { key: 'enabled', label: 'Portal Enabled', format: 'boolean' },
    { key: 'is_enabled', label: 'Enabled In NinjaPipe', format: 'boolean' },
    { key: 'id', label: 'Portal Account ID' },
    { key: 'contact_id', label: 'Contact ID' },
    { key: 'email', label: 'Portal Email', format: 'email' },
    { key: 'generated_password', label: 'Generated Password' },
    { key: 'message', label: 'Message' },
    ...timestamps,
  ]),
  databin: recordSchema([
    { key: 'status', label: 'HTTP Status', format: 'number' },
    { key: 'response', label: 'Response' },
  ]),
  deleted: deleteSchema,
};
