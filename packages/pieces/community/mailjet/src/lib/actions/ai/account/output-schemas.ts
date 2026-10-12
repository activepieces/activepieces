import { OutputSchema } from '@activepieces/pieces-framework';

import { mailjetSchemaUtils } from '../../../output-schemas';

const userFields: OutputSchema['fields'] = [
	{ key: 'ACL', label: 'ACL' },
	{ key: 'CreatedAt', label: 'Created At', format: 'datetime' },
	{ key: 'Email', label: 'Email', format: 'email' },
	{ key: 'FirstIp', label: 'First IP' },
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'LastIp', label: 'Last IP' },
	{ key: 'LastLoginAt', label: 'Last Login At', format: 'datetime' },
	{ key: 'Locale', label: 'Locale' },
	{ key: 'MaxAllowedAPIKeys', label: 'Max Allowed APIKeys', format: 'number' },
	{ key: 'Timezone', label: 'Timezone' },
	{ key: 'Username', label: 'Username' },
	{ key: 'WarnedRatelimitAt', label: 'Warned Ratelimit At' },
];

const profileFields: OutputSchema['fields'] = [
	{ key: 'AddressCity', label: 'Address City' },
	{ key: 'AddressCountry', label: 'Address Country' },
	{ key: 'AddressPostalCode', label: 'Address Postal Code' },
	{ key: 'AddressState', label: 'Address State' },
	{ key: 'AddressStreet', label: 'Address Street' },
	{ key: 'BillingEmail', label: 'Billing Email' },
	{ key: 'BirthdayAt', label: 'Birthday At' },
	{ key: 'CompanyName', label: 'Company Name' },
	{ key: 'CompanyNumOfEmployees', label: 'Company Num Of Employees' },
	{ key: 'ContactPhone', label: 'Contact Phone' },
	{ key: 'EstimatedVolume', label: 'Estimated Volume', format: 'number' },
	{ key: 'Features', label: 'Features' },
	{ key: 'Firstname', label: 'Firstname' },
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'Industry', label: 'Industry' },
	{ key: 'JobTitle', label: 'Job Title' },
	{ key: 'Lastname', label: 'Lastname' },
	{ key: 'UserID', label: 'User ID', format: 'number' },
	{ key: 'VAT', label: 'VAT', format: 'number' },
	{ key: 'VATNumber', label: 'VATNumber' },
	{ key: 'Website', label: 'Website' },
];

export const mailjetUserOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Users',
	labelKey: 'Username',
	fields: userFields,
});

export const mailjetProfileOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Profiles',
	labelKey: 'CompanyName',
	fields: profileFields,
});
