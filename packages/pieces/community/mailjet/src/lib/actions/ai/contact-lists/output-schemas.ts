import { OutputSchema } from '@activepieces/pieces-framework';

import { mailjetSchemaUtils } from '../../../output-schemas';

const listFields: OutputSchema['fields'] = [
	{ key: 'Address', label: 'Address' },
	{ key: 'CreatedAt', label: 'Created At', format: 'datetime' },
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'IsDeleted', label: 'Is Deleted', format: 'boolean' },
	{ key: 'Name', label: 'Name' },
	{ key: 'SubscriberCount', label: 'Subscriber Count', format: 'number' },
];

const importListJobFields: OutputSchema['fields'] = [
	{ key: 'Count', label: 'Count', format: 'number' },
	{ key: 'Error', label: 'Error' },
	{ key: 'JobEnd', label: 'Job End', format: 'datetime' },
	{ key: 'JobStart', label: 'Job Start', format: 'datetime' },
	{ key: 'Status', label: 'Status' },
];

const manageListContactFields: OutputSchema['fields'] = [
	{ key: 'ContactID', label: 'Contact ID', format: 'number' },
	{ key: 'Email', label: 'Email', format: 'email' },
	{ key: 'Action', label: 'Action' },
	{ key: 'Name', label: 'Name' },
	{ key: 'Properties', label: 'Properties', children: [{ key: 'p3city', label: 'P3city' }] },
];

const verifyListJobFields: OutputSchema['fields'] = [
	{ key: 'Akid', label: 'API Key ID', format: 'number' },
	{ key: 'ContactListID', label: 'Contact List ID', format: 'number' },
	{ key: 'Count', label: 'Count', format: 'number' },
	{ key: 'Error', label: 'Error' },
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'JobEnd', label: 'Job End' },
	{ key: 'JobStart', label: 'Job Start', format: 'datetime' },
	{ key: 'Method', label: 'Method' },
	{ key: 'ResponseUrl', label: 'Response URL' },
	{ key: 'Status', label: 'Status' },
	{ key: 'Summary', label: 'Summary' },
];

const csvImportFields: OutputSchema['fields'] = [
	{ key: 'AliveAt', label: 'Alive At', format: 'datetime' },
	{ key: 'ContactsListID', label: 'Contacts List ID', format: 'number' },
	{ key: 'Count', label: 'Count', format: 'number' },
	{ key: 'Current', label: 'Current', format: 'number' },
	{ key: 'DataID', label: 'Data ID', format: 'number' },
	{ key: 'Errcount', label: 'Error Count', format: 'number' },
	{ key: 'ErrTreshold', label: 'Error Threshold', format: 'number' },
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'ImportOptions', label: 'Import Options' },
	{ key: 'JobEnd', label: 'Job End', format: 'datetime' },
	{ key: 'JobStart', label: 'Job Start', format: 'datetime' },
	{ key: 'Method', label: 'Method' },
	{ key: 'RequestAt', label: 'Request At', format: 'datetime' },
	{ key: 'Status', label: 'Status' },
];

const subscriptionFields: OutputSchema['fields'] = [
	{ key: 'ContactID', label: 'Contact ID', format: 'number' },
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'IsActive', label: 'Is Active', format: 'boolean' },
	{ key: 'IsUnsubscribed', label: 'Is Unsubscribed', format: 'boolean' },
	{ key: 'ListID', label: 'List ID', format: 'number' },
	{ key: 'ListName', label: 'List Name' },
	{ key: 'SubscribedAt', label: 'Subscribed At', format: 'datetime' },
	{ key: 'UnsubscribedAt', label: 'Unsubscribed At' },
];

export const mailjetListOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Lists',
	labelKey: 'Name',
	fields: listFields,
});

export const mailjetImportListJobOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Jobs',
	labelKey: 'Status',
	fields: importListJobFields,
});

export const mailjetManageListContactOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Results',
	labelKey: 'Email',
	fields: manageListContactFields,
});

export const mailjetVerifyListJobOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Jobs',
	labelKey: 'Status',
	fields: verifyListJobFields,
});

export const mailjetCsvImportOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Imports',
	labelKey: 'Status',
	fields: csvImportFields,
});

export const mailjetSubscriptionOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Subscriptions',
	labelKey: 'ListName',
	fields: subscriptionFields,
});

export const mailjetSignupRequestOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Signup Requests',
});

export const mailjetCsvImportErrorsOutputSchema: OutputSchema = {
	fields: [{ key: 'csv', label: 'CSV' }],
};

export const mailjetCsvUploadOutputSchema: OutputSchema = {
	fields: [{ key: 'ID', label: 'ID', format: 'number' }],
};
