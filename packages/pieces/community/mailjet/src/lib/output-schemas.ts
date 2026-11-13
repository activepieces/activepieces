import { OutputSchema } from '@activepieces/pieces-framework';

function envelope({ label, labelKey, fields }: EnvelopeParams): OutputSchema {
	return {
		fields: [
			{ key: 'Count', label: 'Count', format: 'number', description: 'Number of records in Data.' },
			{ key: 'Data', label, labelKey, listItems: fields },
			{
				key: 'Total',
				label: 'Total',
				format: 'number',
				description: 'Total number of matching records, for paging.',
			},
		],
	};
}

const jobFields: OutputSchema['fields'] = [{ key: 'JobID', label: 'Job ID', format: 'number' }];

const jobStatusFields: OutputSchema['fields'] = [
	{
		key: 'ContactsLists',
		label: 'Contacts Lists',
		listItems: [
			{ key: 'Action', label: 'Action' },
			{ key: 'ListID', label: 'List ID', format: 'number' },
		],
	},
	{ key: 'Count', label: 'Count', format: 'number' },
	{ key: 'Error', label: 'Error' },
	{ key: 'ErrorFile', label: 'Error File' },
	{ key: 'JobEnd', label: 'Job End', format: 'datetime' },
	{ key: 'JobStart', label: 'Job Start', format: 'datetime' },
	{ key: 'Status', label: 'Status' },
];

export const mailjetSchemaUtils = { envelope };

export const mailjetDeletedOutputSchema: OutputSchema = {
	fields: [{ key: 'deleted', label: 'Deleted', format: 'boolean' }],
};

export const mailjetJobOutputSchema: OutputSchema = envelope({
	label: 'Jobs',
	labelKey: 'JobID',
	fields: jobFields,
});

export const mailjetJobStatusOutputSchema: OutputSchema = envelope({
	label: 'Jobs',
	labelKey: 'Status',
	fields: jobStatusFields,
});

export const sendEmailOutputSchema: OutputSchema = {
	fields: [
		{ key: 'Status', label: 'Status' },
		{ key: 'CustomID', label: 'Custom ID' },
		{
			key: 'To',
			label: 'To',
			listItems: [
				{ key: 'Email', label: 'Email', format: 'email' },
				{ key: 'MessageUUID', label: 'Message UUID' },
				{ key: 'MessageID', label: 'Message ID' },
				{ key: 'MessageHref', label: 'Message Href', format: 'url' },
			],
		},
		{ key: 'Cc', label: 'Cc' },
		{ key: 'Bcc', label: 'Bcc' },
	],
};

type EnvelopeParams = { label: string; labelKey?: string; fields?: OutputSchema['fields'] };
