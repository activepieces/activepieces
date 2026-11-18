import { OutputSchema } from '@activepieces/pieces-framework';

const actorFields: OutputSchema['fields'] = [
	{ key: 'source', label: 'Source' },
	{ key: 'name', label: 'Name' },
	{ key: 'workspaceMemberId', label: 'Workspace Member ID' },
];

const linkFields: OutputSchema['fields'] = [
	{ key: 'primaryLinkUrl', label: 'URL', format: 'url' },
	{ key: 'primaryLinkLabel', label: 'Label' },
];

const amountFields: OutputSchema['fields'] = [
	{ key: 'amountMicros', label: 'Amount (Micros)', format: 'number' },
	{ key: 'currencyCode', label: 'Currency Code' },
];

const recordSystemFields: OutputSchema['fields'] = [
	{ key: 'position', label: 'Position', format: 'number' },
	{ key: 'createdBy', label: 'Created By', children: actorFields },
	{ key: 'updatedBy', label: 'Updated By', children: actorFields },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
	{ key: 'deletedAt', label: 'Deleted At', format: 'datetime' },
];

const recordFields: OutputSchema['fields'] = [
	{
		key: 'id',
		label: 'Record ID',
		description: "The record's own fields follow, named as in Get Object.",
	},
	...recordSystemFields,
];

const companyFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Company ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'domainName', label: 'Domain', children: linkFields },
	{
		key: 'address',
		label: 'Address',
		children: [
			{ key: 'addressStreet1', label: 'Street 1' },
			{ key: 'addressStreet2', label: 'Street 2' },
			{ key: 'addressCity', label: 'City' },
			{ key: 'addressState', label: 'State' },
			{ key: 'addressPostcode', label: 'Postcode' },
			{ key: 'addressCountry', label: 'Country' },
			{ key: 'addressLat', label: 'Latitude', format: 'number' },
			{ key: 'addressLng', label: 'Longitude', format: 'number' },
		],
	},
	{ key: 'linkedinLink', label: 'LinkedIn', children: linkFields },
	{ key: 'annualRevenue', label: 'Annual Revenue', children: amountFields },
	{ key: 'accountOwnerId', label: 'Account Owner ID' },
	...recordSystemFields,
];

const personFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Person ID' },
	{
		key: 'name',
		label: 'Name',
		children: [
			{ key: 'firstName', label: 'First Name' },
			{ key: 'lastName', label: 'Last Name' },
		],
	},
	{
		key: 'emails',
		label: 'Emails',
		children: [
			{ key: 'primaryEmail', label: 'Primary Email', format: 'email' },
			{ key: 'additionalEmails', label: 'Additional Emails' },
		],
	},
	{
		key: 'phones',
		label: 'Phones',
		children: [
			{ key: 'primaryPhoneNumber', label: 'Primary Phone Number' },
			{ key: 'primaryPhoneCountryCode', label: 'Country Code' },
			{ key: 'primaryPhoneCallingCode', label: 'Calling Code' },
		],
	},
	{ key: 'jobTitle', label: 'Job Title' },
	{ key: 'companyId', label: 'Company ID' },
	{ key: 'linkedinLink', label: 'LinkedIn', children: linkFields },
	{ key: 'avatarUrl', label: 'Avatar URL', format: 'image' },
	...recordSystemFields,
];

const opportunityFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Opportunity ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'stage', label: 'Stage' },
	{ key: 'amount', label: 'Amount', children: amountFields },
	{ key: 'closeDate', label: 'Close Date', format: 'datetime' },
	{ key: 'companyId', label: 'Company ID' },
	{ key: 'pointOfContactId', label: 'Point of Contact ID' },
	{ key: 'ownerId', label: 'Owner ID' },
	...recordSystemFields,
];

const pageInfoField: OutputSchema['fields'][number] = {
	key: 'pageInfo',
	label: 'Page Info',
	children: [
		{ key: 'hasNextPage', label: 'Has Next Page', format: 'boolean' },
		{ key: 'hasPreviousPage', label: 'Has Previous Page', format: 'boolean' },
		{ key: 'startCursor', label: 'Start Cursor' },
		{ key: 'endCursor', label: 'End Cursor' },
	],
};

const totalCountField: OutputSchema['fields'][number] = {
	key: 'totalCount',
	label: 'Total Count',
	format: 'number',
};

const metadataFieldFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Field ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'label', label: 'Label' },
	{ key: 'type', label: 'Type' },
	{ key: 'description', label: 'Description' },
	{ key: 'objectMetadataId', label: 'Object ID' },
	{ key: 'isActive', label: 'Is Active', format: 'boolean' },
	{ key: 'isSystem', label: 'Is System', format: 'boolean' },
	{ key: 'isNullable', label: 'Is Nullable', format: 'boolean' },
	{ key: 'isUnique', label: 'Is Unique', format: 'boolean' },
	{ key: 'isUIReadOnly', label: 'Is Read Only', format: 'boolean' },
	{ key: 'defaultValue', label: 'Default Value' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const metadataObjectFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Object ID' },
	{ key: 'nameSingular', label: 'Name (Singular)' },
	{ key: 'namePlural', label: 'Name (Plural)' },
	{ key: 'labelSingular', label: 'Label (Singular)' },
	{ key: 'labelPlural', label: 'Label (Plural)' },
	{ key: 'description', label: 'Description' },
	{ key: 'isActive', label: 'Is Active', format: 'boolean' },
	{ key: 'isSystem', label: 'Is System', format: 'boolean' },
	{ key: 'isRemote', label: 'Is Remote', format: 'boolean' },
	{ key: 'labelIdentifierFieldMetadataId', label: 'Label Field ID' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
	{ key: 'fields', label: 'Fields', labelKey: 'name', listItems: metadataFieldFields },
];

export const createCompanyOutputSchema: OutputSchema = {
	fields: [
		{ key: 'company', label: 'Company', value: 'data.createCompany', children: companyFields },
	],
};

export const updateCompanyOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'company',
			label: 'Updated Company',
			value: 'data.updateCompany',
			children: companyFields,
		},
		{
			key: 'unchangedCompany',
			label: 'Company (No Fields Given)',
			value: 'data.company',
			children: companyFields,
		},
	],
};

export const findCompanyOutputSchema: OutputSchema = {
	itemLabel: '{name}',
	fields: [{ key: 'companies', label: 'Companies', value: '', listItems: companyFields }],
};

export const newCompanyOutputSchema: OutputSchema = { fields: companyFields };

export const createContactOutputSchema: OutputSchema = {
	fields: [{ key: 'person', label: 'Person', value: 'data.createPerson', children: personFields }],
};

export const updatePersonOutputSchema: OutputSchema = {
	fields: [
		{ key: 'person', label: 'Updated Person', value: 'data.updatePerson', children: personFields },
		{
			key: 'unchangedPerson',
			label: 'Person (No Fields Given)',
			value: 'data.person',
			children: personFields,
		},
	],
};

export const findPersonOutputSchema: OutputSchema = {
	itemLabel: '{name.firstName} {name.lastName}',
	fields: [{ key: 'people', label: 'People', value: '', listItems: personFields }],
};

export const newPersonOutputSchema: OutputSchema = { fields: personFields };

export const createOpportunityOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'opportunity',
			label: 'Opportunity',
			value: 'data.createOpportunity',
			children: opportunityFields,
		},
	],
};

export const twentyGetRecordOutputSchema: OutputSchema = { fields: recordFields };

export const twentyCreateRecordOutputSchema: OutputSchema = { fields: recordFields };

export const twentyUpdateRecordOutputSchema: OutputSchema = { fields: recordFields };

export const twentyRestoreRecordOutputSchema: OutputSchema = { fields: recordFields };

export const twentyMergeRecordsOutputSchema: OutputSchema = { fields: recordFields };

export const twentyDeleteRecordOutputSchema: OutputSchema = {
	fields: [{ key: 'id', label: 'Deleted Record ID' }],
};

export const twentyListRecordsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'records', label: 'Records', labelKey: 'id', listItems: recordFields },
		pageInfoField,
		totalCountField,
	],
};

export const twentyCreateRecordsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'records', label: 'Created Records', labelKey: 'id', listItems: recordFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const twentyFindDuplicateRecordsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			description: 'One result per input record, in input order.',
			listItems: [
				{ key: 'duplicates', label: 'Duplicates', labelKey: 'id', listItems: recordFields },
				totalCountField,
				pageInfoField,
			],
		},
	],
};

export const twentyGroupRecordsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'groups',
			label: 'Groups',
			description:
				'Each group also holds one key per requested aggregate, e.g. countNotEmptyId, with the value as a string.',
			listItems: [{ key: 'groupByDimensionValues', label: 'Group Values' }],
		},
		{ key: 'count', label: 'Group Count', format: 'number' },
	],
};

export const twentyListObjectsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'objects', label: 'Objects', labelKey: 'namePlural', listItems: metadataObjectFields },
		pageInfoField,
		totalCountField,
	],
};

export const twentyGetObjectOutputSchema: OutputSchema = { fields: metadataObjectFields };

export const twentyListFieldsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'fields', label: 'Fields', labelKey: 'name', listItems: metadataFieldFields },
		pageInfoField,
		totalCountField,
	],
};
