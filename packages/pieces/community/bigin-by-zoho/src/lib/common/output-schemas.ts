import { OutputSchema } from '@activepieces/pieces-framework';

const userRefFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
];

const writeDetailsFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Record ID' },
  { key: 'Created_Time', label: 'Created Time', format: 'datetime' },
  { key: 'Modified_Time', label: 'Modified Time', format: 'datetime' },
  { key: 'Created_By', label: 'Created By', children: userRefFields },
  { key: 'Modified_By', label: 'Modified By', children: userRefFields },
];

const writeItemFields: OutputSchema['fields'] = [
  { key: 'code', label: 'Result Code' },
  { key: 'status', label: 'Status' },
  { key: 'message', label: 'Message' },
  { key: 'details', label: 'Details', children: writeDetailsFields },
];

const contactListItem: OutputSchema['fields'] = [
  { key: 'id', label: 'Contact ID' },
  { key: 'First_Name', label: 'First Name' },
  { key: 'Last_Name', label: 'Last Name' },
  { key: 'Email', label: 'Email', format: 'email' },
  { key: 'Mobile', label: 'Mobile' },
  { key: 'Phone', label: 'Phone' },
  { key: 'Title', label: 'Title' },
  { key: 'Account_Name', label: 'Company', children: [{ key: 'id', label: 'Company ID' }, { key: 'name', label: 'Company Name' }] },
  { key: 'Owner', label: 'Owner', children: userRefFields },
  { key: 'Created_Time', label: 'Created Time', format: 'datetime' },
  { key: 'Modified_Time', label: 'Modified Time', format: 'datetime' },
];

const companyListItem: OutputSchema['fields'] = [
  { key: 'id', label: 'Company ID' },
  { key: 'Account_Name', label: 'Company Name' },
  { key: 'Phone', label: 'Phone' },
  { key: 'Website', label: 'Website', format: 'url' },
  { key: 'Billing_Street', label: 'Billing Street' },
  { key: 'Billing_City', label: 'Billing City' },
  { key: 'Billing_State', label: 'Billing State' },
  { key: 'Billing_Country', label: 'Billing Country' },
  { key: 'Billing_Code', label: 'Billing Code' },
  { key: 'Owner', label: 'Owner', children: userRefFields },
  { key: 'Created_Time', label: 'Created Time', format: 'datetime' },
  { key: 'Modified_Time', label: 'Modified Time', format: 'datetime' },
];

const dealListItem: OutputSchema['fields'] = [
  { key: 'id', label: 'Pipeline Record ID' },
  { key: 'Deal_Name', label: 'Deal Name' },
  { key: 'Stage', label: 'Stage' },
  { key: 'Sub_Pipeline', label: 'Sub-Pipeline' },
  { key: 'Amount', label: 'Amount', format: 'number' },
  { key: 'Closing_Date', label: 'Closing Date', format: 'date' },
  { key: 'Owner', label: 'Owner', children: userRefFields },
  { key: 'Created_Time', label: 'Created Time', format: 'datetime' },
  { key: 'Modified_Time', label: 'Modified Time', format: 'datetime' },
];

const productListItem: OutputSchema['fields'] = [
  { key: 'id', label: 'Product ID' },
  { key: 'Product_Name', label: 'Product Name' },
  { key: 'Product_Code', label: 'Product Code' },
  { key: 'Unit_Price', label: 'Unit Price', format: 'number' },
  { key: 'Product_Active', label: 'Active', format: 'boolean' },
  { key: 'Owner', label: 'Owner', children: userRefFields },
];

const userFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID' },
  { key: 'full_name', label: 'Full Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'status', label: 'Status' },
  { key: 'role', label: 'Role', children: [{ key: 'id', label: 'Role ID' }, { key: 'name', label: 'Role Name' }] },
  { key: 'profile', label: 'Profile', children: [{ key: 'id', label: 'Profile ID' }, { key: 'name', label: 'Profile Name' }] },
];

const legacyAckWithMessage: OutputSchema = {
  fields: [
    { key: 'message', label: 'Message' },
    { key: 'data', label: 'Result', children: writeItemFields },
  ],
};

const legacyAckRaw: OutputSchema = { fields: writeItemFields };

const legacyPipelineUpdate: OutputSchema = {
  fields: [
    { key: 'message', label: 'Message' },
    { key: 'pipelineRecord', label: 'Result', children: writeItemFields },
  ],
};

function legacySearch(listItems: OutputSchema['fields']): OutputSchema {
  return {
    fields: [
      { key: 'message', label: 'Message' },
      { key: 'data', label: 'Records', listItems },
    ],
  };
}

const legacyUserSearch: OutputSchema = {
  fields: [
    { key: 'message', label: 'Message' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'data', label: 'Users', listItems: userFields, labelKey: 'full_name' },
  ],
};

const aiRecordPage: OutputSchema = {
  fields: [
    { key: 'records', label: 'Records' },
    { key: 'more_records', label: 'More Records', format: 'boolean' },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'per_page', label: 'Per Page', format: 'number' },
    { key: 'next_page_token', label: 'Next Page Token' },
  ],
};

const aiSearchPage: OutputSchema = {
  fields: [
    { key: 'records', label: 'Records' },
    { key: 'more_records', label: 'More Records', format: 'boolean' },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'per_page', label: 'Per Page', format: 'number' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

const aiGetRecord: OutputSchema = {
  fields: [{ key: 'record', label: 'Record' }],
};

const aiCreateResult: OutputSchema = {
  fields: [
    { key: 'id', label: 'Record ID' },
    { key: 'created_time', label: 'Created Time', format: 'datetime' },
    { key: 'record', label: 'Record' },
  ],
};

const aiUpdateResult: OutputSchema = {
  fields: [
    { key: 'id', label: 'Record ID' },
    { key: 'modified_time', label: 'Modified Time', format: 'datetime' },
    { key: 'record', label: 'Record' },
  ],
};

const aiListUsers: OutputSchema = {
  fields: [
    { key: 'users', label: 'Users', listItems: userFields, labelKey: 'full_name' },
    { key: 'more_records', label: 'More Records', format: 'boolean' },
  ],
};

const aiListPipelines: OutputSchema = {
  fields: [
    {
      key: 'pipelines',
      label: 'Pipelines',
      labelKey: 'name',
      listItems: [
        { key: 'layout_id', label: 'Pipeline (Layout) ID' },
        { key: 'name', label: 'Pipeline Name' },
        { key: 'sub_pipelines', label: 'Sub-Pipelines' },
        { key: 'stages', label: 'Stages' },
      ],
    },
  ],
};

const addNoteResult: OutputSchema = {
  fields: [
    { key: 'id', label: 'Note ID' },
    { key: 'created_time', label: 'Created Time', format: 'datetime' },
    { key: 'parent_id', label: 'Parent Record ID' },
    { key: 'module', label: 'Module' },
  ],
};

const deleteResult: OutputSchema = {
  fields: [
    { key: 'id', label: 'Deleted Record ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

const triggerPayload: OutputSchema = {
  fields: [
    { key: 'module', label: 'Module' },
    { key: 'operation', label: 'Operation' },
    { key: 'ids', label: 'Record IDs' },
    { key: 'channel_id', label: 'Channel ID' },
    { key: 'server_time', label: 'Server Time', format: 'number' },
    { key: 'affected_fields', label: 'Affected Fields' },
    { key: 'records', label: 'Records (first 10)', description: 'Full records for the first 10 record IDs only. Record IDs lists every ID.' },
    { key: 'records_error', label: 'Records Fetch Error' },
  ],
};

export const biginOutputSchemas = {
  legacyAckWithMessage,
  legacyAckRaw,
  legacyPipelineUpdate,
  legacyContactSearch: legacySearch(contactListItem),
  legacyCompanySearch: legacySearch(companyListItem),
  legacyDealSearch: legacySearch(dealListItem),
  legacyProductSearch: legacySearch(productListItem),
  legacyUserSearch,
  aiRecordPage,
  aiSearchPage,
  aiGetRecord,
  aiCreateResult,
  aiUpdateResult,
  aiListUsers,
  aiListPipelines,
  addNoteResult,
  deleteResult,
  triggerPayload,
};
