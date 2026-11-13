import { OutputSchema } from '@activepieces/pieces-framework';

import { mailjetSchemaUtils } from '../../../output-schemas';

const templateFields: OutputSchema['fields'] = [
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'OrganisationID', label: 'Organisation ID', format: 'number' },
	{ key: 'Name', label: 'Name' },
	{ key: 'EditMode', label: 'Edit Mode', format: 'number' },
	{ key: 'LabelIDs', label: 'Label IDs' },
	{ key: 'LastContentType', label: 'Last Content Type' },
	{ key: 'PartialIDs', label: 'Partial IDs' },
	{ key: 'Purposes', label: 'Purposes' },
	{ key: 'Categories', label: 'Categories' },
	{ key: 'Presets', label: 'Presets' },
	{ key: 'ExternalID', label: 'External ID' },
	{ key: 'Description', label: 'Description' },
	{ key: 'IsPublished', label: 'Is Published', format: 'boolean' },
	{ key: 'IsStarred', label: 'Is Starred', format: 'boolean' },
	{ key: 'SoftDeleted', label: 'Soft Deleted', format: 'boolean' },
	{
		key: 'IsTextPartGenerationEnabled',
		label: 'Is Text Part Generation Enabled',
		format: 'boolean',
	},
	{ key: 'CreatedAt', label: 'Created At', format: 'datetime' },
	{ key: 'UpdatedAt', label: 'Updated At', format: 'datetime' },
];

const templateContentFields: OutputSchema['fields'] = [
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'OrganisationID', label: 'Organisation ID', format: 'number' },
	{ key: 'UserID', label: 'User ID', format: 'number' },
	{ key: 'TemplateID', label: 'Template ID', format: 'number' },
	{ key: 'ContentType', label: 'Content Type' },
	{ key: 'Author', label: 'Author' },
	{ key: 'Name', label: 'Name' },
	{ key: 'IsLocked', label: 'Is Locked', format: 'boolean' },
	{ key: 'Locale', label: 'Locale' },
	{ key: 'HTMLPart', label: 'HTML Part' },
	{ key: 'TextPart', label: 'Text Part' },
	{ key: 'CreatedAt', label: 'Created At', format: 'datetime' },
	{ key: 'UpdatedAt', label: 'Updated At', format: 'datetime' },
];

export const mailjetTemplateOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Templates',
	labelKey: 'Name',
	fields: templateFields,
});

export const mailjetTemplateContentOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Contents',
	labelKey: 'Locale',
	fields: templateContentFields,
});

export const mailjetSavedTemplateContentOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Contents',
	labelKey: 'Locale',
	fields: [...templateContentFields, { key: 'MJMLPart', label: 'MJML Part' }],
});

export const mailjetTemplateLockOutputSchema: OutputSchema = {
	fields: [{ key: 'locked', label: 'Locked', format: 'boolean' }],
};
