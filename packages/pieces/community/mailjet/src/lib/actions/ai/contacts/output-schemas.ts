import { OutputSchema } from '@activepieces/pieces-framework';

import { mailjetSchemaUtils } from '../../../output-schemas';

const contactFields: OutputSchema['fields'] = [
	{ key: 'CreatedAt', label: 'Created At', format: 'datetime' },
	{ key: 'DeliveredCount', label: 'Delivered Count', format: 'number' },
	{ key: 'Email', label: 'Email', format: 'email' },
	{
		key: 'ExclusionFromCampaignsUpdatedAt',
		label: 'Exclusion From Campaigns Updated At',
		format: 'datetime',
	},
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'IsExcludedFromCampaigns', label: 'Is Excluded From Campaigns', format: 'boolean' },
	{ key: 'IsOptInPending', label: 'Is Opt In Pending', format: 'boolean' },
	{ key: 'IsSpamComplaining', label: 'Is Spam Complaining', format: 'boolean' },
	{ key: 'LastActivityAt', label: 'Last Activity At', format: 'datetime' },
	{ key: 'LastUpdateAt', label: 'Last Update At', format: 'datetime' },
	{ key: 'Name', label: 'Name' },
	{ key: 'UnsubscribedAt', label: 'Unsubscribed At' },
	{ key: 'UnsubscribedBy', label: 'Unsubscribed By' },
];

const contactDataFields: OutputSchema['fields'] = [
	{ key: 'ContactID', label: 'Contact ID', format: 'number' },
	{
		key: 'Data',
		label: 'Properties',
		labelKey: 'Name',
		listItems: [
			{ key: 'Name', label: 'Name' },
			{ key: 'Value', label: 'Value' },
		],
	},
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'MethodCollection', label: 'Method Collection' },
];

const contactListSubscriptionFields: OutputSchema['fields'] = [
	{ key: 'IsActive', label: 'Is Active', format: 'boolean' },
	{ key: 'IsUnsub', label: 'Is Unsubscribed', format: 'boolean' },
	{ key: 'ListID', label: 'List ID', format: 'number' },
	{ key: 'SubscribedAt', label: 'Subscribed At', format: 'datetime' },
];

const contactListMembershipsFields: OutputSchema['fields'] = [
	{
		key: 'ContactsLists',
		label: 'Contacts Lists',
		listItems: [
			{ key: 'Action', label: 'Action' },
			{ key: 'ListID', label: 'List ID', format: 'number' },
		],
	},
];

export const mailjetContactOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Contacts',
	labelKey: 'Email',
	fields: contactFields,
});

export const mailjetContactDataOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Contact Data',
	labelKey: 'ContactID',
	fields: contactDataFields,
});

export const mailjetContactListSubscriptionOutputSchema: OutputSchema = mailjetSchemaUtils.envelope(
	{ label: 'Lists', labelKey: 'ListID', fields: contactListSubscriptionFields },
);

export const mailjetContactListMembershipsOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Results',
	fields: contactListMembershipsFields,
});
