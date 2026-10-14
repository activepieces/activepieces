import { OutputSchema } from '@activepieces/pieces-framework';

type Field = OutputSchema['fields'][number];

const actorChildren: Field[] = [
	{ key: 'on', label: 'At', format: 'datetime' },
	{ key: 'by', label: 'By (Member ID)' },
];

const rawRecordFields: Field[] = [
	{ key: 'id', label: 'Record ID', description: 'Use this to get, update or delete the record in a later step.' },
	{ key: 'title', label: 'Title' },
	{ key: 'application_id', label: 'Table ID' },
	{ key: 'application_slug', label: 'Table Slug' },
	{ key: 'first_created', label: 'First Created', children: actorChildren },
	{ key: 'last_updated', label: 'Last Updated', children: actorChildren },
	{ key: 'autonumber', label: 'Auto Number', format: 'number' },
	{ key: 'comments_count', label: 'Open Comments', format: 'number' },	{ key: 'all_fields', label: 'All Fields', value: '', dynamicKey: true, description: 'Every field of the record keyed by field slug, including the fields specific to your table.' },
];

const labelledRecordFields: Field[] = [
	{ key: 'id', label: 'Record ID', description: 'Use this to get, update or delete the record in a later step.' },
	{ key: 'Title', label: 'Title', description: 'The record title. Other fields are keyed by their label in your table, so they differ from table to table.' },
	{ key: 'application_id', label: 'Table ID' },
	{ key: 'application_slug', label: 'Table Slug' },
	{ key: 'First Created', label: 'First Created', children: actorChildren },
	{ key: 'Last Updated', label: 'Last Updated', children: actorChildren },	{ key: 'all_fields', label: 'All Fields', value: '', dynamicKey: true, description: 'Every field of the record keyed by its label, including the fields specific to your table.' },
];

const solutionFields: Field[] = [
	{ key: 'id', label: 'Solution ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'slug', label: 'Slug' },
	{ key: 'status', label: 'Status' },
	{ key: 'hidden', label: 'Hidden', format: 'boolean' },
	{ key: 'applications_count', label: 'Tables', format: 'number' },
	{ key: 'records_count', label: 'Records', format: 'number' },
	{ key: 'members_count', label: 'Members', format: 'number' },
	{ key: 'created', label: 'Created', format: 'datetime' },
	{ key: 'updated', label: 'Updated', format: 'datetime' },
];

const tableSummaryFields: Field[] = [
	{ key: 'id', label: 'Table ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'slug', label: 'Slug' },
	{ key: 'solution', label: 'Solution ID' },
	{ key: 'status', label: 'Status' },
	{ key: 'primary_field', label: 'Primary Field Slug' },
	{ key: 'fields_count', label: 'Fields', format: 'number' },
];

const tableFieldFields: Field[] = [
	{ key: 'slug', label: 'Field Slug', description: 'Use this key when you pass field values to create, update or list records.' },
	{ key: 'label', label: 'Label' },
	{ key: 'field_type', label: 'Field Type' },
	{ key: 'required', label: 'Required', format: 'boolean' },
	{ key: 'system', label: 'System Field', format: 'boolean', description: 'System fields are set by SmartSuite and cannot be written.' },
	{ key: 'linked_table_id', label: 'Linked Table ID' },
	{
		key: 'choices',
		label: 'Choices',
		listItems: [
			{ key: 'label', label: 'Label' },
			{ key: 'value', label: 'Value', description: 'Pass this value (not the label) when you set a select or status field.' },
		],
	},
];

const listMeta: Field[] = [
	{ key: 'total', label: 'Total Matches', format: 'number', description: 'Total number of matching items reported by SmartSuite.' },
	{ key: 'offset', label: 'Offset', format: 'number' },
	{ key: 'limit', label: 'Limit', format: 'number' },
	{ key: 'hasMore', label: 'Has More', format: 'boolean', description: 'True when more items exist; call again with offset + number of items returned.' },
];

const memberFields: Field[] = [
	{ key: 'id', label: 'Member ID' },
	{ key: 'full_name', label: 'Full Name', children: [{ key: 'sys_root', label: 'Full Name' }, { key: 'first_name', label: 'First Name' }, { key: 'last_name', label: 'Last Name' }] },
	{ key: 'email', label: 'Emails' },
	{ key: 'job_title', label: 'Job Title' },
	{ key: 'role', label: 'Role' },
	{ key: 'type', label: 'Type' },
	{ key: 'timezone', label: 'Time Zone' },
	{ key: 'status', label: 'Status', children: [{ key: 'value', label: 'Value' }] },
];

const teamFields: Field[] = [
	{ key: 'id', label: 'Team ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'owners', label: 'Owner IDs' },
	{ key: 'members', label: 'Member IDs' },
];

const commentFields: Field[] = [
	{ key: 'id', label: 'Comment ID' },
	{ key: 'record', label: 'Record ID' },
	{ key: 'application', label: 'Table ID' },
	{ key: 'solution', label: 'Solution ID' },
	{ key: 'member', label: 'Author (Member ID)' },
	{ key: 'created_on', label: 'Created On', format: 'datetime' },
	{ key: 'message', label: 'Message', children: [{ key: 'html', label: 'HTML' }, { key: 'preview', label: 'Preview' }] },
	{ key: 'parent_comment', label: 'Parent Comment ID' },
	{ key: 'assigned_to', label: 'Assigned To' },
];

const deletedRecordFields: Field[] = [
	{ key: 'id', label: 'Record ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'application_id', label: 'Table ID' },
	{ key: 'application_name', label: 'Table Name' },
	{ key: 'solution_id', label: 'Solution ID' },
	{ key: 'deleted_by', label: 'Deleted By (Member ID)' },
	{ key: 'deleted_date', label: 'Deleted Date', children: [{ key: 'date', label: 'Date', format: 'datetime' }] },
];

export const outputSchemas: Record<string, OutputSchema> = {
	labelledRecord: { fields: labelledRecordFields },
	rawRecord: { fields: rawRecordFields },
	findRecords: {
		fields: [
			{ key: 'found', label: 'Found', format: 'boolean' },
			{ key: 'result', label: 'Records', listItems: labelledRecordFields },
			{ key: 'hasMore', label: 'Has More', format: 'boolean', description: 'True when Max Records was reached and more matches exist.' },
		],
	},
	recordPage: {
		fields: [{ key: 'items', label: 'Records', listItems: rawRecordFields }, ...listMeta],
	},
	deleteRecord: {
		fields: [
			{ key: 'id', label: 'Record ID' },
			{ key: 'deleted', label: 'Deleted', format: 'boolean' },
			{ key: 'alreadyDeleted', label: 'Already Deleted', format: 'boolean', description: 'True when SmartSuite no longer knows the record (404). A record already in the trash is deleted again and reports false.' },
		],
	},
	uploadFile: {
		fields: [
			{ key: 'recordId', label: 'Record ID' },
			{ key: 'field', label: 'File Field Slug' },
			{ key: 'fileName', label: 'File Name' },
			{
				key: 'files',
				label: 'Files In Field',
				listItems: [
					{ key: 'handle', label: 'File Handle', description: 'Pass this to Get File Download URL.' },
					{ key: 'metadata', label: 'Metadata', children: [{ key: 'filename', label: 'File Name' }, { key: 'mimetype', label: 'MIME Type' }, { key: 'size', label: 'Size (bytes)', format: 'number' }] },
					{ key: 'created_on', label: 'Created On', format: 'datetime' },
				],
			},
		],
	},
	solutionList: { fields: [{ key: 'items', label: 'Solutions', listItems: solutionFields }, { key: 'count', label: 'Count', format: 'number' }] },
	solution: { fields: solutionFields },
	tableList: { fields: [{ key: 'items', label: 'Tables', listItems: tableSummaryFields }, { key: 'count', label: 'Count', format: 'number' }] },
	tableSchema: { fields: [...tableSummaryFields, { key: 'fields', label: 'Fields', listItems: tableFieldFields }] },
	bulkRecords: { fields: [{ key: 'items', label: 'Records', listItems: rawRecordFields }, { key: 'count', label: 'Count', format: 'number' }] },
	bulkDelete: {
		fields: [
			{ key: 'deletedIds', label: 'Deleted Record IDs' },
			{ key: 'count', label: 'Count', format: 'number' },
		],
	},
	upsertRecord: {
		fields: [
			{ key: 'action', label: 'Action', description: 'created or updated.' },
			{ key: 'record', label: 'Record', children: rawRecordFields },
		],
	},
	deletedRecordList: { fields: [{ key: 'items', label: 'Deleted Records', listItems: deletedRecordFields }, { key: 'count', label: 'Count', format: 'number' }] },
	commentList: { fields: [{ key: 'items', label: 'Comments', listItems: commentFields }, { key: 'count', label: 'Count', format: 'number' }] },
	comment: { fields: commentFields },
	memberPage: { fields: [{ key: 'items', label: 'Members', listItems: memberFields }, ...listMeta] },
	member: { fields: memberFields },
	teamPage: { fields: [{ key: 'items', label: 'Teams', listItems: teamFields }, ...listMeta] },
	fileUrl: {
		fields: [
			{ key: 'handle', label: 'File Handle' },
			{ key: 'url', label: 'Download URL', format: 'url', description: 'A temporary link to the file. It expires, so use it soon.' },
		],
	},
	recordFileUrls: {
		fields: [
			{ key: 'recordId', label: 'Record ID' },
			{ key: 'field', label: 'File Field Slug' },
			{
				key: 'files',
				label: 'Files',
				listItems: [
					{ key: 'handle', label: 'File Handle' },
					{ key: 'name', label: 'File Name' },
					{ key: 'url', label: 'Download URL', format: 'url', description: 'A temporary link to the file. It expires, so use it soon.' },
				],
			},
			{ key: 'count', label: 'Count', format: 'number' },
		],
	},
	addField: {
		fields: [
			{ key: 'tableId', label: 'Table ID' },
			{ key: 'field', label: 'Field', children: tableFieldFields },
		],
	},
	restoreRecord: { fields: rawRecordFields },
};
