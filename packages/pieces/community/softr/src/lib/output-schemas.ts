import { OutputSchema } from '@activepieces/pieces-framework';

const recordFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Record ID' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
	{ key: 'fields', label: 'Fields', dynamicKey: true, description: 'Record values keyed by field name.' },
];

const tableFieldFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Field ID' },
	{ key: 'name', label: 'Field Name' },
	{ key: 'type', label: 'Type' },
	{ key: 'readonly', label: 'Read Only', format: 'boolean' },
	{ key: 'required', label: 'Required', format: 'boolean' },
	{ key: 'allowMultipleEntries', label: 'Allows Multiple Values', format: 'boolean' },
];

const tableFieldsList: OutputSchema['fields'] = [
	{ key: 'id', label: 'Table ID' },
	{ key: 'name', label: 'Table Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'primaryFieldId', label: 'Primary Field ID' },
	{ key: 'fields', label: 'Fields', labelKey: 'name', listItems: tableFieldFields },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const databaseFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Database ID' },
	{ key: 'name', label: 'Database Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'workspaceId', label: 'Workspace ID' },
	{ key: 'tablesCount', label: 'Tables Count', format: 'number' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const viewFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'View ID' },
	{ key: 'tableId', label: 'Table ID' },
	{ key: 'name', label: 'View Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const record: OutputSchema = { fields: recordFields };

const database: OutputSchema = { fields: databaseFields };

const field: OutputSchema = {
	fields: [
		...tableFieldFields,
		{ key: 'description', label: 'Description' },
		{ key: 'options', label: 'Options' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
	],
};

const tableViews: OutputSchema = {
	fields: [
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'views', label: 'Views', labelKey: 'name', listItems: viewFields },
	],
};

const findRecord: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', format: 'boolean' },
		{ key: 'data', label: 'Record', children: recordFields },
	],
};

const findRecords: OutputSchema = {
	fields: [
		{ key: 'found', label: 'Found', format: 'boolean' },
		{ key: 'count', label: 'Records Returned', format: 'number' },
		{ key: 'total', label: 'Total Matches', format: 'number' },
		{ key: 'offset', label: 'Offset', format: 'number' },
		{ key: 'hasMore', label: 'Has More', format: 'boolean' },
		{ key: 'records', label: 'Records', labelKey: 'id', listItems: recordFields },
	],
};

const listDatabases: OutputSchema = {
	fields: [
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'databases', label: 'Databases', labelKey: 'name', listItems: databaseFields },
	],
};

const listTables: OutputSchema = {
	fields: [
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'tables', label: 'Tables', labelKey: 'name', listItems: tableFieldsList },
	],
};

const table: OutputSchema = { fields: tableFieldsList };

const createAppUser: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'message', label: 'Message' },
		{
			key: 'user',
			label: 'User',
			children: [
				{ key: 'status', label: 'HTTP Status', format: 'number' },
				{
					key: 'body',
					label: 'Softr User',
					children: [
						{ key: 'email', label: 'Email', format: 'email' },
						{ key: 'full_name', label: 'Full Name' },
						{ key: 'magic_link', label: 'Magic Link', format: 'url' },
						{ key: 'created', label: 'Created' },
						{ key: 'updated', label: 'Updated' },
					],
				},
			],
		},
	],
};

const appUserStatus: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'email', label: 'Email', format: 'email' },
		{ key: 'message', label: 'Message' },
	],
};

const magicLink: OutputSchema = {
	fields: [
		{ key: 'email', label: 'Email', format: 'email' },
		{ key: 'magicLink', label: 'Magic Link', format: 'url' },
	],
};

const schemaFieldFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Field ID' },
	{ key: 'name', label: 'Column Name' },
	{ key: 'type', label: 'Type' },
	{ key: 'required', label: 'Required', format: 'boolean' },
	{ key: 'readonly', label: 'Read Only', format: 'boolean' },
	{ key: 'allowMultipleEntries', label: 'Allows Multiple Values', format: 'boolean' },
	{
		key: 'options',
		label: 'Select Options',
		labelKey: 'label',
		listItems: [
			{ key: 'id', label: 'Option ID' },
			{ key: 'label', label: 'Option Label' },
		],
	},
];

const databaseSchema: OutputSchema = {
	fields: [
		{ key: 'databaseId', label: 'Database ID' },
		{ key: 'tableCount', label: 'Table Count', format: 'number' },
		{
			key: 'tables',
			label: 'Tables',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Table ID' },
				{ key: 'name', label: 'Table Name' },
				{ key: 'description', label: 'Description' },
				{ key: 'primaryFieldId', label: 'Primary Field ID' },
				{ key: 'fields', label: 'Fields', labelKey: 'name', listItems: schemaFieldFields },
			],
		},
	],
};

const upsertRecord: OutputSchema = {
	fields: [
		{ key: 'action', label: 'Action', description: 'created or updated.' },
		{ key: 'record', label: 'Record', children: recordFields },
	],
};

export const softrOutputSchemas = {
	record,
	databaseSchema,
	upsertRecord,
	database,
	field,
	tableViews,
	findRecord,
	findRecords,
	listDatabases,
	listTables,
	table,
	createAppUser,
	appUserStatus,
	magicLink,
};
