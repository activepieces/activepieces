import { OutputSchema } from '@activepieces/pieces-framework';

const createResultFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Record ID' },
	{ key: 'success', label: 'Success', format: 'boolean' },
];

const updateResultFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Record ID' },
	{ key: 'success', label: 'Success', format: 'boolean' },
	{ key: 'updated_fields', label: 'Updated Fields' },
];

const queryPageFields: OutputSchema['fields'] = [
	{ key: 'count', label: 'Records Returned', format: 'number' },
	{ key: 'total_size', label: 'Total Matching Records', format: 'number' },
	{ key: 'done', label: 'All Records Returned', format: 'boolean' },
	{ key: 'next_records_url', label: 'Next Records URL' },
];

const compositeResultItemFields: OutputSchema['fields'] = [
	{ key: 'index', label: 'Index', format: 'number' },
	{ key: 'id', label: 'Record ID' },
	{ key: 'success', label: 'Success', format: 'boolean' },
	{ key: 'errors', label: 'Errors' },
];

const compositeCountFields: OutputSchema['fields'] = [
	{ key: 'success_count', label: 'Succeeded', format: 'number' },
	{ key: 'failure_count', label: 'Failed', format: 'number' },
];

const bulkJobSummaryFields: OutputSchema['fields'] = [
	{ key: 'job_id', label: 'Job ID' },
	{ key: 'state', label: 'State' },
	{ key: 'object', label: 'Object' },
	{ key: 'operation', label: 'Operation' },
];

const reportRowsFields: OutputSchema['fields'] = [
	{ key: 'reportName', label: 'Report Name' },
	{ key: 'reportId', label: 'Report ID' },
	{ key: 'totalRows', label: 'Total Rows', format: 'number' },
	{ key: 'columns', label: 'Columns' },
	{ key: 'rows', label: 'Rows' },
];

const accountNameFields: OutputSchema['fields'] = [{ key: 'Name', label: 'Account Name' }];

const accountRecordFields: OutputSchema['fields'] = [
	{ key: 'Id', label: 'Account ID' },
	{ key: 'Name', label: 'Name' },
	{ key: 'Phone', label: 'Phone' },
	{ key: 'Website', label: 'Website', format: 'url' },
	{ key: 'Industry', label: 'Industry' },
	{ key: 'Type', label: 'Type' },
	{ key: 'BillingCity', label: 'Billing City' },
	{ key: 'BillingState', label: 'Billing State' },
	{ key: 'BillingCountry', label: 'Billing Country' },
	{ key: 'OwnerId', label: 'Owner ID' },
	{ key: 'ParentId', label: 'Parent Account ID' },
	{ key: 'CreatedDate', label: 'Created Date', format: 'datetime' },
	{ key: 'LastModifiedDate', label: 'Last Modified Date', format: 'datetime' },
];

const contactRecordFields: OutputSchema['fields'] = [
	{ key: 'Id', label: 'Contact ID' },
	{ key: 'FirstName', label: 'First Name' },
	{ key: 'LastName', label: 'Last Name' },
	{ key: 'Name', label: 'Full Name' },
	{ key: 'Email', label: 'Email', format: 'email' },
	{ key: 'Phone', label: 'Phone' },
	{ key: 'MobilePhone', label: 'Mobile Phone' },
	{ key: 'Title', label: 'Title' },
	{ key: 'Department', label: 'Department' },
	{ key: 'AccountId', label: 'Account ID' },
	{ key: 'Account', label: 'Account', children: accountNameFields },
	{ key: 'OwnerId', label: 'Owner ID' },
	{ key: 'CreatedDate', label: 'Created Date', format: 'datetime' },
	{ key: 'LastModifiedDate', label: 'Last Modified Date', format: 'datetime' },
];

const leadRecordFields: OutputSchema['fields'] = [
	{ key: 'Id', label: 'Lead ID' },
	{ key: 'FirstName', label: 'First Name' },
	{ key: 'LastName', label: 'Last Name' },
	{ key: 'Name', label: 'Full Name' },
	{ key: 'Company', label: 'Company' },
	{ key: 'Email', label: 'Email', format: 'email' },
	{ key: 'Phone', label: 'Phone' },
	{ key: 'Title', label: 'Title' },
	{ key: 'Status', label: 'Status' },
	{ key: 'LeadSource', label: 'Lead Source' },
	{ key: 'Industry', label: 'Industry' },
	{ key: 'IsConverted', label: 'Converted', format: 'boolean' },
	{ key: 'ConvertedContactId', label: 'Converted Contact ID' },
	{ key: 'ConvertedAccountId', label: 'Converted Account ID' },
	{ key: 'OwnerId', label: 'Owner ID' },
	{ key: 'CreatedDate', label: 'Created Date', format: 'datetime' },
	{ key: 'LastModifiedDate', label: 'Last Modified Date', format: 'datetime' },
];

const opportunityRecordFields: OutputSchema['fields'] = [
	{ key: 'Id', label: 'Opportunity ID' },
	{ key: 'Name', label: 'Name' },
	{ key: 'AccountId', label: 'Account ID' },
	{ key: 'Account', label: 'Account', children: accountNameFields },
	{ key: 'StageName', label: 'Stage' },
	{ key: 'Amount', label: 'Amount', format: 'number' },
	{ key: 'Probability', label: 'Probability (%)', format: 'number' },
	{ key: 'CloseDate', label: 'Close Date', format: 'date' },
	{ key: 'IsClosed', label: 'Closed', format: 'boolean' },
	{ key: 'IsWon', label: 'Won', format: 'boolean' },
	{ key: 'Type', label: 'Type' },
	{ key: 'LeadSource', label: 'Lead Source' },
	{ key: 'NextStep', label: 'Next Step' },
	{ key: 'Pricebook2Id', label: 'Price Book ID' },
	{ key: 'OwnerId', label: 'Owner ID' },
	{ key: 'CreatedDate', label: 'Created Date', format: 'datetime' },
	{ key: 'LastModifiedDate', label: 'Last Modified Date', format: 'datetime' },
];

const pricebookRecordFields: OutputSchema['fields'] = [
	{ key: 'Id', label: 'Price Book ID' },
	{ key: 'Name', label: 'Name' },
	{ key: 'IsActive', label: 'Active', format: 'boolean' },
	{ key: 'IsStandard', label: 'Standard', format: 'boolean' },
	{ key: 'Description', label: 'Description' },
];

const pricebookEntryRecordFields: OutputSchema['fields'] = [
	{ key: 'Id', label: 'Price Book Entry ID' },
	{ key: 'Pricebook2Id', label: 'Price Book ID' },
	{ key: 'Product2Id', label: 'Product ID' },
	{ key: 'Product2', label: 'Product', children: [{ key: 'Name', label: 'Product Name' }] },
	{ key: 'ProductCode', label: 'Product Code' },
	{ key: 'UnitPrice', label: 'Unit Price', format: 'number' },
	{ key: 'IsActive', label: 'Active', format: 'boolean' },
];

const bulkJobFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Job ID' },
	{ key: 'state', label: 'State' },
	{ key: 'object', label: 'Object' },
	{ key: 'operation', label: 'Operation' },
	{ key: 'numberRecordsProcessed', label: 'Records Processed', format: 'number' },
	{ key: 'numberRecordsFailed', label: 'Records Failed', format: 'number' },
	{ key: 'errorMessage', label: 'Error Message' },
	{ key: 'createdDate', label: 'Created Date', format: 'datetime' },
	{ key: 'systemModstamp', label: 'Last Modified Date', format: 'datetime' },
	{ key: 'totalProcessingTime', label: 'Total Processing Time (ms)', format: 'number' },
];

const sobjectEnvelopeFields: OutputSchema['fields'] = [
	{ key: 'Id', label: 'Record ID' },
	{ key: 'attributes', label: 'Record Info', children: [{ key: 'type', label: 'Object' }] },
];

const addressFields: OutputSchema['fields'] = [
	{ key: 'street', label: 'Street' },
	{ key: 'city', label: 'City' },
	{ key: 'state', label: 'State' },
	{ key: 'postalCode', label: 'Postal Code' },
	{ key: 'country', label: 'Country' },
];

const rawQueryFields: OutputSchema['fields'] = [
	{ key: 'totalSize', label: 'Total Matching Records', format: 'number' },
	{ key: 'done', label: 'All Records Returned', format: 'boolean' },
	{ key: 'records', label: 'Records' },
];

export const addContactToCampaignMemberOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Campaign Member ID' },
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'campaign_id', label: 'Campaign ID' },
		{ key: 'contact_id', label: 'Contact ID' },
	],
};

export const addLeadToCampaignMemberOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Campaign Member ID' },
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'campaign_id', label: 'Campaign ID' },
		{ key: 'lead_id', label: 'Lead ID' },
	],
};

export const addOpportunityProductOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Opportunity Product ID' },
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'opportunity_id', label: 'Opportunity ID' },
		{ key: 'pricebook_entry_id', label: 'Price Book Entry ID' },
		{ key: 'quantity', label: 'Quantity', format: 'number' },
	],
};

export const applyLeadAssignmentRulesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Lead ID' },
		{ key: 'previous_owner_id', label: 'Previous Owner ID' },
		{ key: 'owner_id', label: 'Owner ID' },
		{ key: 'reassigned', label: 'Reassigned', format: 'boolean' },
	],
};

export const completeTaskOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Task ID' },
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'status', label: 'Status' },
		{ key: 'updated_fields', label: 'Updated Fields' },
	],
};

export const createAccountOutputSchema: OutputSchema = {
	fields: [...createResultFields, { key: 'name', label: 'Account Name' }],
};

export const createCampaignOutputSchema: OutputSchema = {
	fields: [...createResultFields, { key: 'name', label: 'Campaign Name' }],
};

export const createSfContactOutputSchema: OutputSchema = {
	fields: [
		...createResultFields,
		{ key: 'last_name', label: 'Last Name' },
		{ key: 'email', label: 'Email', format: 'email' },
	],
};

export const createSfLeadOutputSchema: OutputSchema = {
	fields: [
		...createResultFields,
		{ key: 'last_name', label: 'Last Name' },
		{ key: 'company', label: 'Company' },
	],
};

export const createSfNoteOutputSchema: OutputSchema = {
	fields: [
		...createResultFields,
		{ key: 'parent_id', label: 'Parent Record ID' },
		{ key: 'title', label: 'Title' },
	],
};

export const createSfOpportunityOutputSchema: OutputSchema = {
	fields: [
		...createResultFields,
		{ key: 'name', label: 'Opportunity Name' },
		{ key: 'stage', label: 'Stage' },
		{ key: 'close_date', label: 'Close Date', format: 'date' },
	],
};

export const createSfTaskOutputSchema: OutputSchema = {
	fields: [...createResultFields, { key: 'subject', label: 'Subject' }],
};

export const createSobjectRecordOutputSchema: OutputSchema = {
	fields: [...createResultFields, { key: 'object', label: 'Object' }],
};

export const logCallOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Task ID' },
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'subject', label: 'Subject' },
		{ key: 'status', label: 'Status' },
		{ key: 'activity_date', label: 'Call Date', format: 'date' },
	],
};

export const logEmailActivityOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Email Message ID' },
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'recipient_id', label: 'Recipient ID' },
		{ key: 'related_record_id', label: 'Related Record ID' },
		{ key: 'subject', label: 'Subject' },
	],
};

export const updateRecordOutputSchema: OutputSchema = { fields: updateResultFields };

export const upsertRecordByExternalIdOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Record ID' },
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'created', label: 'Created', format: 'boolean' },
		{ key: 'external_id_field', label: 'External ID Field' },
		{ key: 'external_id_value', label: 'External ID Value' },
		{ key: 'updated_fields', label: 'Updated Fields' },
	],
};

export const deletedRecordOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Deleted ID' },
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
	],
};

export const compositeBatchOutputSchema: OutputSchema = {
	fields: [
		{ key: 'results', label: 'Results', labelKey: 'id', listItems: compositeResultItemFields },
		...compositeCountFields,
	],
};

export const upsertRecordsBatchOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'id',
			listItems: [...compositeResultItemFields, { key: 'created', label: 'Created', format: 'boolean' }],
		},
		...compositeCountFields,
	],
};

export const createRecordTreeOutputSchema: OutputSchema = {
	fields: [
		{ key: 'has_errors', label: 'Has Errors', format: 'boolean' },
		{
			key: 'results',
			label: 'Results',
			labelKey: 'reference_id',
			listItems: [
				{ key: 'reference_id', label: 'Reference ID' },
				{ key: 'id', label: 'Record ID' },
				{ key: 'errors', label: 'Errors' },
			],
		},
	],
};

export const recordOutputSchema: OutputSchema = {
	fields: [
		{ key: 'Id', label: 'Record ID' },
		{ key: 'record', label: 'Record Fields', value: '', dynamicKey: true },
	],
};

export const getRecordsBatchOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'records',
			label: 'Records',
			labelKey: 'requested_id',
			listItems: [
				{ key: 'requested_id', label: 'Requested ID' },
				{ key: 'found', label: 'Found', format: 'boolean' },
				{ key: 'record', label: 'Record', dynamicKey: true },
			],
		},
		{ key: 'count', label: 'Records Requested', format: 'number' },
		{ key: 'found_count', label: 'Records Found', format: 'number' },
	],
};

export const getQuickActionDefaultsOutputSchema: OutputSchema = {
	fields: [{ key: 'defaults', label: 'Default Field Values', value: '', dynamicKey: true }],
};

export const soqlQueryOutputSchema: OutputSchema = {
	fields: [{ key: 'records', label: 'Records' }, ...queryPageFields],
};

export const searchAccountsOutputSchema: OutputSchema = {
	fields: [{ key: 'records', label: 'Accounts', labelKey: 'Name', listItems: accountRecordFields }, ...queryPageFields],
};

export const searchContactsOutputSchema: OutputSchema = {
	fields: [{ key: 'records', label: 'Contacts', labelKey: 'Name', listItems: contactRecordFields }, ...queryPageFields],
};

export const searchLeadsOutputSchema: OutputSchema = {
	fields: [{ key: 'records', label: 'Leads', labelKey: 'Name', listItems: leadRecordFields }, ...queryPageFields],
};

export const searchOpportunitiesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'records', label: 'Opportunities', labelKey: 'Name', listItems: opportunityRecordFields },
		...queryPageFields,
	],
};

export const listDashboardsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'records',
			label: 'Dashboards',
			labelKey: 'Title',
			listItems: [
				{ key: 'Id', label: 'Dashboard ID' },
				{ key: 'Title', label: 'Title' },
				{ key: 'DeveloperName', label: 'Developer Name' },
				{ key: 'FolderName', label: 'Folder Name' },
				{ key: 'Description', label: 'Description' },
				{ key: 'LastModifiedDate', label: 'Last Modified Date', format: 'datetime' },
			],
		},
		...queryPageFields,
	],
};

export const listEmailTemplatesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'records',
			label: 'Email Templates',
			labelKey: 'Name',
			listItems: [
				{ key: 'Id', label: 'Template ID' },
				{ key: 'Name', label: 'Name' },
				{ key: 'DeveloperName', label: 'Developer Name' },
				{ key: 'Subject', label: 'Subject' },
				{ key: 'FolderId', label: 'Folder ID' },
				{ key: 'TemplateType', label: 'Template Type' },
				{ key: 'IsActive', label: 'Active', format: 'boolean' },
				{ key: 'LastModifiedDate', label: 'Last Modified Date', format: 'datetime' },
			],
		},
		...queryPageFields,
	],
};

export const listReportsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'records',
			label: 'Reports',
			labelKey: 'Name',
			listItems: [
				{ key: 'Id', label: 'Report ID' },
				{ key: 'Name', label: 'Name' },
				{ key: 'DeveloperName', label: 'Developer Name' },
				{ key: 'FolderName', label: 'Folder Name' },
				{ key: 'Format', label: 'Format' },
				{ key: 'Description', label: 'Description' },
				{ key: 'LastRunDate', label: 'Last Run Date', format: 'datetime' },
				{ key: 'LastModifiedDate', label: 'Last Modified Date', format: 'datetime' },
			],
		},
		...queryPageFields,
	],
};

export const listPricebooksOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'pricebooks',
			label: 'Price Books',
			children: [
				{ key: 'records', label: 'Price Books', labelKey: 'Name', listItems: pricebookRecordFields },
				...queryPageFields,
			],
		},
		{
			key: 'entries',
			label: 'Price Book Entries',
			children: [
				{ key: 'records', label: 'Entries', labelKey: 'ProductCode', listItems: pricebookEntryRecordFields },
				...queryPageFields,
			],
		},
	],
};

export const searchRecordsSoslOutputSchema: OutputSchema = {
	fields: [
		{ key: 'records', label: 'Records' },
		{ key: 'count', label: 'Records Returned', format: 'number' },
	],
};

export const getListViewRecordsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'records', label: 'Records' },
		{ key: 'count', label: 'Records Returned', format: 'number' },
		{ key: 'size', label: 'List View Size', format: 'number' },
		{ key: 'done', label: 'All Records Returned', format: 'boolean' },
	],
};

export const getListViewMetadataOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'List View ID' },
		{ key: 'sobject_type', label: 'Object' },
		{ key: 'query', label: 'SOQL Query' },
		{
			key: 'columns',
			label: 'Columns',
			labelKey: 'label',
			listItems: [
				{ key: 'field_name_or_path', label: 'Field' },
				{ key: 'label', label: 'Label' },
				{ key: 'sortable', label: 'Sortable', format: 'boolean' },
				{ key: 'type', label: 'Type' },
			],
		},
		{
			key: 'order_by',
			label: 'Order By',
			labelKey: 'fieldNameOrPath',
			listItems: [
				{ key: 'fieldNameOrPath', label: 'Field' },
				{ key: 'sortDirection', label: 'Sort Direction' },
				{ key: 'nullsPosition', label: 'Nulls Position' },
			],
		},
		{
			key: 'where_condition',
			label: 'Filter',
			children: [
				{ key: 'conjunction', label: 'Conjunction' },
				{ key: 'conditions', label: 'Conditions' },
			],
		},
	],
};

export const listListViewsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'list_views',
			label: 'List Views',
			labelKey: 'label',
			listItems: [
				{ key: 'id', label: 'List View ID' },
				{ key: 'label', label: 'Label' },
				{ key: 'developer_name', label: 'Developer Name' },
				{ key: 'soql_compatible', label: 'SOQL Compatible', format: 'boolean' },
				{ key: 'results_url', label: 'Results URL' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const describeObjectOutputSchema: OutputSchema = {
	fields: [
		{ key: 'name', label: 'API Name' },
		{ key: 'label', label: 'Label' },
		{ key: 'custom', label: 'Custom', format: 'boolean' },
		{ key: 'key_prefix', label: 'Key Prefix' },
		{
			key: 'fields',
			label: 'Fields',
			labelKey: 'name',
			listItems: [
				{ key: 'name', label: 'API Name' },
				{ key: 'label', label: 'Label' },
				{ key: 'type', label: 'Type' },
				{ key: 'length', label: 'Length', format: 'number' },
				{ key: 'nillable', label: 'Nillable', format: 'boolean' },
				{ key: 'createable', label: 'Createable', format: 'boolean' },
				{ key: 'updateable', label: 'Updateable', format: 'boolean' },
				{ key: 'custom', label: 'Custom', format: 'boolean' },
				{ key: 'external_id', label: 'External ID', format: 'boolean' },
				{ key: 'reference_to', label: 'References' },
				{
					key: 'picklist_values',
					label: 'Picklist Values',
					labelKey: 'label',
					listItems: [
						{ key: 'value', label: 'Value' },
						{ key: 'label', label: 'Label' },
					],
				},
			],
		},
		{
			key: 'child_relationships',
			label: 'Child Relationships',
			labelKey: 'relationship_name',
			listItems: [
				{ key: 'relationship_name', label: 'Relationship Name' },
				{ key: 'child_object', label: 'Child Object' },
				{ key: 'field', label: 'Field' },
			],
		},
		{
			key: 'record_types',
			label: 'Record Types',
			labelKey: 'name',
			listItems: [
				{ key: 'name', label: 'Name' },
				{ key: 'developer_name', label: 'Developer Name' },
				{ key: 'record_type_id', label: 'Record Type ID' },
				{ key: 'active', label: 'Active', format: 'boolean' },
				{ key: 'master', label: 'Master', format: 'boolean' },
			],
		},
	],
};

export const listObjectsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'objects',
			label: 'Objects',
			labelKey: 'name',
			listItems: [
				{ key: 'name', label: 'API Name' },
				{ key: 'label', label: 'Label' },
				{ key: 'custom', label: 'Custom', format: 'boolean' },
				{ key: 'queryable', label: 'Queryable', format: 'boolean' },
				{ key: 'createable', label: 'Createable', format: 'boolean' },
				{ key: 'updateable', label: 'Updateable', format: 'boolean' },
				{ key: 'deletable', label: 'Deletable', format: 'boolean' },
				{ key: 'key_prefix', label: 'Key Prefix' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const downloadFileOutputSchema: OutputSchema = {
	fields: [
		{ key: 'file', label: 'File', format: 'url' },
		{ key: 'file_name', label: 'File Name' },
		{ key: 'size', label: 'Size', format: 'filesize' },
		{ key: 'mime_type', label: 'MIME Type' },
	],
};

export const getFileInfoOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Content Document ID' },
		{ key: 'title', label: 'Title' },
		{ key: 'name', label: 'Name' },
		{ key: 'file_extension', label: 'File Extension' },
		{ key: 'file_type', label: 'File Type' },
		{ key: 'content_size', label: 'Size', format: 'filesize' },
		{ key: 'mime_type', label: 'MIME Type' },
		{ key: 'owner_id', label: 'Owner ID' },
		{ key: 'owner_name', label: 'Owner Name' },
		{ key: 'created_date', label: 'Created Date', format: 'datetime' },
		{ key: 'modified_date', label: 'Modified Date', format: 'datetime' },
		{ key: 'version_number', label: 'Version Number' },
		{ key: 'download_url', label: 'Download Path' },
	],
};

export const uploadFileOutputSchema: OutputSchema = {
	fields: [
		{ key: 'content_version_id', label: 'Content Version ID' },
		{ key: 'content_document_id', label: 'Content Document ID' },
		{ key: 'title', label: 'Title' },
		{ key: 'record_id', label: 'Linked Record ID' },
	],
};

export const bulkJobCreatedOutputSchema: OutputSchema = { fields: bulkJobSummaryFields };

export const bulkJobOutputSchema: OutputSchema = { fields: bulkJobFields };

export const getBulkIngestResultsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'rows', label: 'Rows' },
		{ key: 'count', label: 'Row Count', format: 'number' },
	],
};

export const getBulkQueryResultsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'rows', label: 'Rows' },
		{ key: 'count', label: 'Row Count', format: 'number' },
		{ key: 'next_locator', label: 'Next Locator' },
	],
};

export const getCurrentUserOutputSchema: OutputSchema = {
	fields: [
		{ key: 'user_id', label: 'User ID' },
		{ key: 'organization_id', label: 'Organization ID' },
		{ key: 'username', label: 'Username' },
		{ key: 'name', label: 'Name' },
		{ key: 'email', label: 'Email', format: 'email' },
		{ key: 'locale', label: 'Locale' },
		{ key: 'zoneinfo', label: 'Time Zone' },
		{ key: 'user_type', label: 'User Type' },
	],
};

export const getDashboardOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Dashboard ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'developer_name', label: 'Developer Name' },
		{ key: 'folder_id', label: 'Folder ID' },
		{
			key: 'components',
			label: 'Components',
			labelKey: 'header',
			listItems: [
				{ key: 'id', label: 'Component ID' },
				{ key: 'header', label: 'Header' },
				{ key: 'title', label: 'Title' },
				{ key: 'type', label: 'Type' },
				{ key: 'visualization_type', label: 'Visualization Type' },
				{ key: 'report_id', label: 'Report ID' },
			],
		},
		{
			key: 'filters',
			label: 'Filters',
			labelKey: 'name',
			listItems: [
				{ key: 'name', label: 'Name' },
				{
					key: 'options',
					label: 'Options',
					labelKey: 'alias',
					listItems: [
						{ key: 'id', label: 'Option ID' },
						{ key: 'alias', label: 'Alias' },
						{ key: 'operation', label: 'Operation' },
						{ key: 'value', label: 'Value' },
					],
				},
			],
		},
	],
};

export const getOrgLimitsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'limits',
			label: 'Limits',
			labelKey: 'name',
			listItems: [
				{ key: 'name', label: 'Limit' },
				{ key: 'max', label: 'Max', format: 'number' },
				{ key: 'remaining', label: 'Remaining', format: 'number' },
				{ key: 'used', label: 'Used', format: 'number' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const getRecordCountsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'counts',
			label: 'Record Counts',
			labelKey: 'name',
			listItems: [
				{ key: 'name', label: 'Object' },
				{ key: 'count', label: 'Record Count', format: 'number' },
			],
		},
		{ key: 'count', label: 'Objects Counted', format: 'number' },
	],
};

export const getReportOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Report ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'developer_name', label: 'Developer Name' },
		{ key: 'format', label: 'Format' },
		{ key: 'report_type', label: 'Report Type' },
		{ key: 'report_type_label', label: 'Report Type Label' },
		{ key: 'detail_columns', label: 'Detail Columns' },
		{ key: 'groupings_down', label: 'Row Groupings' },
		{ key: 'filters', label: 'Filters' },
		{ key: 'filter_logic', label: 'Filter Logic' },
		{
			key: 'columns',
			label: 'Columns',
			labelKey: 'label',
			listItems: [
				{ key: 'api_name', label: 'API Name' },
				{ key: 'label', label: 'Label' },
				{ key: 'data_type', label: 'Data Type' },
			],
		},
	],
};

export const runReportSyncOutputSchema: OutputSchema = { fields: reportRowsFields };

export const getReportInstanceOutputSchema: OutputSchema = {
	fields: [
		{ key: 'instance_id', label: 'Instance ID' },
		{ key: 'status', label: 'Status' },
		...reportRowsFields,
	],
};

export const runReportAsyncOutputSchema: OutputSchema = {
	fields: [
		{ key: 'instance_id', label: 'Instance ID' },
		{ key: 'status', label: 'Status' },
		{ key: 'report_id', label: 'Report ID' },
		{ key: 'request_date', label: 'Request Date', format: 'datetime' },
	],
};

export const getUpdatedRecordIdsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'ids', label: 'Record IDs' },
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'latest_date_covered', label: 'Latest Date Covered', format: 'datetime' },
	],
};

export const listInvocableActionsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'actions',
			label: 'Actions',
			labelKey: 'label',
			listItems: [
				{ key: 'name', label: 'Name' },
				{ key: 'label', label: 'Label' },
				{ key: 'type', label: 'Type' },
				{ key: 'url', label: 'API Path' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const runInvocableActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			labelKey: 'action_name',
			listItems: [
				{ key: 'action_name', label: 'Action Name' },
				{ key: 'is_success', label: 'Success', format: 'boolean' },
				{ key: 'errors', label: 'Errors' },
				{ key: 'output_values', label: 'Output Values', dynamicKey: true },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'failed_count', label: 'Failed', format: 'number' },
	],
};

export const listQuickActionsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'actions',
			label: 'Quick Actions',
			labelKey: 'label',
			listItems: [
				{ key: 'name', label: 'Name' },
				{ key: 'label', label: 'Label' },
				{ key: 'type', label: 'Type' },
				{ key: 'sobject_type', label: 'Object' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const runQuickActionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Record ID' },
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'created', label: 'Created', format: 'boolean' },
		{ key: 'context_id', label: 'Context Record ID' },
		{ key: 'feed_item_ids', label: 'Feed Item IDs' },
		{ key: 'errors', label: 'Errors' },
	],
};

export const searchKnowledgeArticlesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'articles',
			label: 'Articles',
			labelKey: 'title',
			listItems: [
				{ key: 'id', label: 'Article ID' },
				{ key: 'article_number', label: 'Article Number' },
				{ key: 'title', label: 'Title' },
				{ key: 'summary', label: 'Summary' },
				{ key: 'url_name', label: 'URL Name' },
				{ key: 'last_published_date', label: 'Last Published Date', format: 'datetime' },
				{ key: 'view_count', label: 'View Count', format: 'number' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const sendEmailMessageOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'email_addresses', label: 'Email Addresses' },
		{ key: 'recipient_id', label: 'Recipient ID' },
		{ key: 'related_record_id', label: 'Related Record ID' },
		{ key: 'subject', label: 'Subject' },
	],
};

export const sobjectCreateResponseOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Record ID' },
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'errors', label: 'Errors' },
	],
};

export const successOutputSchema: OutputSchema = {
	fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const exportReportOutputSchema: OutputSchema = {
	fields: [{ key: 'file', label: 'Report File', value: '', format: 'url' }],
};

export const findChildRecordsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'count', label: 'Records Returned', format: 'number' },
		{
			key: 'records',
			label: 'Records',
			labelKey: 'id',
			listItems: [
				{ key: 'id', label: 'Record ID' },
				{ key: 'apiName', label: 'Object' },
				{ key: 'fields', label: 'Fields', dynamicKey: true },
				{ key: 'lastModifiedById', label: 'Last Modified By ID' },
				{ key: 'lastModifiedDate', label: 'Last Modified Date', format: 'datetime' },
				{ key: 'recordTypeId', label: 'Record Type ID' },
			],
		},
		{ key: 'nextPageToken', label: 'Next Page Token' },
		{ key: 'nextPageUrl', label: 'Next Page URL' },
	],
};

export const rawQueryOutputSchema: OutputSchema = { fields: rawQueryFields };

export const runQueryOutputSchema: OutputSchema = {
	fields: [
		{ key: 'status', label: 'HTTP Status', format: 'number' },
		{ key: 'body', label: 'Result', children: rawQueryFields },
	],
};

export const getRecordAttachmentsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'classic_attachments',
			label: 'Classic Attachments',
			labelKey: 'Name',
			listItems: [
				{ key: 'Id', label: 'Attachment ID' },
				{ key: 'Name', label: 'Name' },
				{ key: 'BodyLength', label: 'Size', format: 'filesize' },
				{ key: 'ContentType', label: 'Content Type' },
			],
		},
		{
			key: 'files',
			label: 'Files',
			labelKey: 'Title',
			listItems: [
				{ key: 'Id', label: 'Content Document ID' },
				{ key: 'Title', label: 'Title' },
			],
		},
	],
};

export const upsertByExternalIdOutputSchema: OutputSchema = {
	fields: [
		{ key: 'status', label: 'HTTP Status', format: 'number' },
		{
			key: 'body',
			label: 'Results',
			labelKey: 'id',
			listItems: [
				{ key: 'id', label: 'Record ID' },
				{ key: 'success', label: 'Success', format: 'boolean' },
				{ key: 'created', label: 'Created', format: 'boolean' },
				{ key: 'errors', label: 'Errors' },
			],
		},
	],
};

export const upsertByExternalIdBulkOutputSchema: OutputSchema = {
	fields: [
		{ key: 'status', label: 'HTTP Status', format: 'number' },
		{
			key: 'body',
			label: 'Bulk Job',
			children: [
				{ key: 'id', label: 'Job ID' },
				{ key: 'state', label: 'State' },
				{ key: 'object', label: 'Object' },
				{ key: 'operation', label: 'Operation' },
				{ key: 'externalIdFieldName', label: 'External ID Field' },
				{ key: 'numberRecordsProcessed', label: 'Records Processed', format: 'number' },
				{ key: 'numberRecordsFailed', label: 'Records Failed', format: 'number' },
				{ key: 'createdById', label: 'Created By ID' },
				{ key: 'createdDate', label: 'Created Date', format: 'datetime' },
				{ key: 'systemModstamp', label: 'Last Modified Date', format: 'datetime' },
			],
		},
	],
};

export const newRecordTriggerOutputSchema: OutputSchema = {
	fields: [
		...sobjectEnvelopeFields,
		{ key: 'CreatedDate', label: 'Created Date', format: 'datetime' },
		{ key: 'LastModifiedDate', label: 'Last Modified Date', format: 'datetime' },
		{ key: 'record', label: 'Record Fields', value: '', dynamicKey: true },
	],
};

export const newCaseTriggerOutputSchema: OutputSchema = {
	fields: [
		{ key: 'Id', label: 'Case ID' },
		{ key: 'CaseNumber', label: 'Case Number' },
		{ key: 'Subject', label: 'Subject' },
		{ key: 'Description', label: 'Description' },
		{ key: 'Status', label: 'Status' },
		{ key: 'Priority', label: 'Priority' },
		{ key: 'Origin', label: 'Origin' },
		{ key: 'Type', label: 'Type' },
		{ key: 'Reason', label: 'Reason' },
		{ key: 'IsClosed', label: 'Is Closed', format: 'boolean' },
		{ key: 'IsEscalated', label: 'Is Escalated', format: 'boolean' },
		{ key: 'ClosedDate', label: 'Closed Date', format: 'datetime' },
		{ key: 'AccountId', label: 'Account ID' },
		{ key: 'ContactId', label: 'Contact ID' },
		{ key: 'ContactEmail', label: 'Contact Email', format: 'email' },
		{ key: 'ContactPhone', label: 'Contact Phone' },
		{ key: 'ParentId', label: 'Parent Case ID' },
		{ key: 'SuppliedName', label: 'Web Name' },
		{ key: 'SuppliedEmail', label: 'Web Email', format: 'email' },
		{ key: 'SuppliedPhone', label: 'Web Phone' },
		{ key: 'SuppliedCompany', label: 'Web Company' },
		{ key: 'OwnerId', label: 'Owner (Queue) ID' },
		{ key: 'CreatedById', label: 'Created By ID' },
		{ key: 'CreatedDate', label: 'Created Date', format: 'datetime' },
		{ key: 'LastModifiedDate', label: 'Last Modified Date', format: 'datetime' },
	],
};

export const newContactTriggerOutputSchema: OutputSchema = {
	fields: [
		{ key: 'Id', label: 'Contact ID' },
		{ key: 'Name', label: 'Full Name' },
		{ key: 'Salutation', label: 'Salutation' },
		{ key: 'FirstName', label: 'First Name' },
		{ key: 'LastName', label: 'Last Name' },
		{ key: 'Email', label: 'Email', format: 'email' },
		{ key: 'Phone', label: 'Phone' },
		{ key: 'MobilePhone', label: 'Mobile Phone' },
		{ key: 'Title', label: 'Title' },
		{ key: 'Department', label: 'Department' },
		{ key: 'AccountId', label: 'Account ID' },
		{ key: 'LeadSource', label: 'Lead Source' },
		{ key: 'Description', label: 'Description' },
		{ key: 'MailingAddress', label: 'Mailing Address', children: addressFields },
		{ key: 'OwnerId', label: 'Owner ID' },
		{ key: 'CreatedById', label: 'Created By ID' },
		{ key: 'CreatedDate', label: 'Created Date', format: 'datetime' },
		{ key: 'LastModifiedDate', label: 'Last Modified Date', format: 'datetime' },
	],
};

export const newLeadTriggerOutputSchema: OutputSchema = {
	fields: [
		{ key: 'Id', label: 'Lead ID' },
		{ key: 'Name', label: 'Full Name' },
		{ key: 'Salutation', label: 'Salutation' },
		{ key: 'FirstName', label: 'First Name' },
		{ key: 'LastName', label: 'Last Name' },
		{ key: 'Company', label: 'Company' },
		{ key: 'Title', label: 'Title' },
		{ key: 'Email', label: 'Email', format: 'email' },
		{ key: 'Phone', label: 'Phone' },
		{ key: 'MobilePhone', label: 'Mobile Phone' },
		{ key: 'Website', label: 'Website', format: 'url' },
		{ key: 'Status', label: 'Status' },
		{ key: 'LeadSource', label: 'Lead Source' },
		{ key: 'Industry', label: 'Industry' },
		{ key: 'Rating', label: 'Rating' },
		{ key: 'Description', label: 'Description' },
		{ key: 'Address', label: 'Address', children: addressFields },
		{ key: 'IsConverted', label: 'Converted', format: 'boolean' },
		{ key: 'OwnerId', label: 'Owner ID' },
		{ key: 'CreatedById', label: 'Created By ID' },
		{ key: 'CreatedDate', label: 'Created Date', format: 'datetime' },
		{ key: 'LastModifiedDate', label: 'Last Modified Date', format: 'datetime' },
	],
};

export const newUpdatedFileTriggerOutputSchema: OutputSchema = {
	fields: [
		{ key: 'Id', label: 'Content Document ID' },
		{ key: 'Title', label: 'Title' },
		{ key: 'FileType', label: 'File Type' },
		{ key: 'FileExtension', label: 'File Extension' },
		{ key: 'ContentSize', label: 'Size', format: 'filesize' },
		{ key: 'Description', label: 'Description' },
		{ key: 'LatestPublishedVersionId', label: 'Latest Version ID' },
		{ key: 'PublishStatus', label: 'Publish Status' },
		{ key: 'IsArchived', label: 'Archived', format: 'boolean' },
		{ key: 'OwnerId', label: 'Owner ID' },
		{ key: 'CreatedById', label: 'Created By ID' },
		{ key: 'CreatedDate', label: 'Created Date', format: 'datetime' },
		{ key: 'LastModifiedDate', label: 'Last Modified Date', format: 'datetime' },
		{ key: 'ContentModifiedDate', label: 'Content Modified Date', format: 'datetime' },
		{ key: 'Type', label: 'Type' },
	],
};

export const newCaseAttachmentTriggerOutputSchema: OutputSchema = {
	fields: [
		{ key: 'Id', label: 'Attachment ID' },
		{ key: 'attachment_type', label: 'Attachment Type' },
		{ key: 'ParentId', label: 'Case ID' },
		{ key: 'Name', label: 'Name' },
		{ key: 'ContentType', label: 'Content Type' },
		{ key: 'CreatedDate', label: 'Created Date', format: 'datetime' },
	],
};

export const newFieldHistoryEventTriggerOutputSchema: OutputSchema = {
	fields: [
		{ key: 'Id', label: 'History ID' },
		{ key: 'ParentId', label: 'Record ID' },
		{ key: 'Field', label: 'Field' },
		{ key: 'OldValue', label: 'Old Value' },
		{ key: 'NewValue', label: 'New Value' },
		{ key: 'IsDeleted', label: 'Deleted', format: 'boolean' },
		{ key: 'CreatedById', label: 'Changed By ID' },
		{ key: 'CreatedDate', label: 'Changed Date', format: 'datetime' },
	],
};

export const newOutboundMessageTriggerOutputSchema: OutputSchema = {
	itemLabel: 'Notification {Id}',
	fields: [
		{
			key: 'notifications',
			label: 'Notifications',
			value: '',
			listItems: [
				{ key: 'Id', label: 'Notification ID' },
				{ key: 'sObject', label: 'Record', dynamicKey: true },
			],
		},
	],
};
