import { OutputSchema } from '@activepieces/pieces-framework';

import { mailjetSchemaUtils } from '../../../output-schemas';

const senderFields: OutputSchema['fields'] = [
	{ key: 'CreatedAt', label: 'Created At', format: 'datetime' },
	{ key: 'DNSID', label: 'DNSID', format: 'number' },
	{ key: 'Email', label: 'Email', format: 'email' },
	{ key: 'EmailType', label: 'Email Type' },
	{ key: 'Filename', label: 'Filename' },
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'IsDefaultSender', label: 'Is Default Sender', format: 'boolean' },
	{ key: 'Name', label: 'Name' },
	{ key: 'Status', label: 'Status' },
];

const dnsFields: OutputSchema['fields'] = [
	{ key: 'DKIMRecordName', label: 'DKIMRecord Name' },
	{ key: 'DKIMRecordValue', label: 'DKIMRecord Value' },
	{ key: 'DKIMStatus', label: 'DKIMStatus' },
	{ key: 'Domain', label: 'Domain' },
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'IsCheckInProgress', label: 'Is Check In Progress', format: 'boolean' },
	{ key: 'LastCheckAt', label: 'Last Check At', format: 'datetime' },
	{ key: 'OwnerShipToken', label: 'Ownership Token' },
	{ key: 'OwnerShipTokenRecordName', label: 'Ownership Token Record Name' },
	{ key: 'SPFRecordValue', label: 'SPFRecord Value' },
	{ key: 'SPFStatus', label: 'SPFStatus' },
];

const dnsCheckFields: OutputSchema['fields'] = [
	{ key: 'DKIMErrors', label: 'DKIMErrors' },
	{ key: 'DKIMRecordCurrentValue', label: 'DKIMRecord Current Value' },
	{ key: 'DKIMStatus', label: 'DKIMStatus' },
	{ key: 'SPFErrors', label: 'SPFErrors' },
	{ key: 'SPFRecordsCurrentValues', label: 'SPFRecords Current Values' },
	{ key: 'SPFStatus', label: 'SPFStatus' },
];

const metasenderFields: OutputSchema['fields'] = [
	{ key: 'CreatedAt', label: 'Created At', format: 'datetime' },
	{ key: 'Description', label: 'Description' },
	{ key: 'Email', label: 'Email', format: 'email' },
	{ key: 'Filename', label: 'Filename' },
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'IsEnabled', label: 'Is Enabled', format: 'boolean' },
];

export const mailjetSenderOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Senders',
	labelKey: 'Email',
	fields: senderFields,
});

export const mailjetDnsOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'DNS Records',
	labelKey: 'Domain',
	fields: dnsFields,
});

export const mailjetDnsCheckOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Checks',
	labelKey: 'DKIMStatus',
	fields: dnsCheckFields,
});

export const mailjetMetasenderOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Metasenders',
	labelKey: 'Email',
	fields: metasenderFields,
});

export const mailjetSenderValidationOutputSchema: OutputSchema = {
	fields: [
		{ key: 'ValidationMethod', label: 'Validation Method' },
		{
			key: 'Errors',
			label: 'Errors',
			children: [
				{ key: 'FileValidationError', label: 'File Validation Error' },
				{ key: 'DNSValidationError', label: 'DNS Validation Error' },
			],
		},
		{ key: 'GlobalError', label: 'Global Error' },
	],
};
