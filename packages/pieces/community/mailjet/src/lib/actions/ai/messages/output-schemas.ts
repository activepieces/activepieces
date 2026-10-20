import { OutputSchema } from '@activepieces/pieces-framework';

import { mailjetSchemaUtils } from '../../../output-schemas';

const messageFields: OutputSchema['fields'] = [
	{ key: 'ArrivedAt', label: 'Arrived At', format: 'datetime' },
	{ key: 'AttachmentCount', label: 'Attachment Count', format: 'number' },
	{ key: 'AttemptCount', label: 'Attempt Count', format: 'number' },
	{ key: 'ContactAlt', label: 'Contact Alt', format: 'email' },
	{ key: 'ContactID', label: 'Contact ID', format: 'number' },
	{ key: 'Delay', label: 'Delay', format: 'duration' },
	{ key: 'DestinationID', label: 'Destination ID', format: 'number' },
	{ key: 'FilterTime', label: 'Filter Time', format: 'number' },
	{ key: 'ID', label: 'ID' },
	{ key: 'IsClickTracked', label: 'Is Click Tracked', format: 'boolean' },
	{ key: 'IsHTMLPartIncluded', label: 'HTML Part Included', format: 'boolean' },
	{ key: 'IsOpenTracked', label: 'Is Open Tracked', format: 'boolean' },
	{ key: 'IsTextPartIncluded', label: 'Is Text Part Included', format: 'boolean' },
	{ key: 'IsUnsubTracked', label: 'Is Unsub Tracked', format: 'boolean' },
	{ key: 'MessageSize', label: 'Message Size', format: 'filesize' },
	{ key: 'SenderID', label: 'Sender ID', format: 'number' },
	{ key: 'SpamassassinScore', label: 'SpamAssassin Score', format: 'number' },
	{ key: 'SpamassRules', label: 'SpamAssassin Rules' },
	{ key: 'StatePermanent', label: 'State Permanent', format: 'boolean' },
	{ key: 'Status', label: 'Status' },
	{ key: 'Subject', label: 'Subject' },
	{ key: 'UUID', label: 'UUID' },
	{ key: 'CampaignID', label: 'Campaign ID', format: 'number' },
];

const clickFields: OutputSchema['fields'] = [
	{ key: 'ClickedAt', label: 'Clicked At', format: 'datetime' },
	{ key: 'ClickedDelay', label: 'Clicked Delay', format: 'duration' },
	{ key: 'ContactID', label: 'Contact ID', format: 'number' },
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'MessageID', label: 'Message ID' },
	{ key: 'Url', label: 'URL', format: 'url' },
	{ key: 'UserAgentID', label: 'User Agent ID', format: 'number' },
];

const openFields: OutputSchema['fields'] = [
	{ key: 'ArrivedAt', label: 'Arrived At', format: 'datetime' },
	{ key: 'CampaignID', label: 'Campaign ID', format: 'number' },
	{ key: 'ContactID', label: 'Contact ID', format: 'number' },
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'MessageID', label: 'Message ID' },
	{ key: 'OpenedAt', label: 'Opened At', format: 'datetime' },
	{ key: 'UserAgentFull', label: 'User Agent Full' },
	{ key: 'UserAgentID', label: 'User Agent ID', format: 'number' },
];

const messageHistoryFields: OutputSchema['fields'] = [
	{ key: 'Comment', label: 'Comment' },
	{ key: 'EventAt', label: 'Event At', format: 'number' },
	{ key: 'EventType', label: 'Event Type' },
	{ key: 'State', label: 'State' },
	{ key: 'Useragent', label: 'User Agent' },
	{ key: 'UseragentID', label: 'User Agent ID', format: 'number' },
];

const messageInformationFields: OutputSchema['fields'] = [
	{ key: 'CampaignID', label: 'Campaign ID', format: 'number' },
	{ key: 'ClickTrackedCount', label: 'Click Tracked Count', format: 'number' },
	{ key: 'ContactID', label: 'Contact ID', format: 'number' },
	{ key: 'CreatedAt', label: 'Created At', format: 'datetime' },
	{ key: 'ID', label: 'ID' },
	{ key: 'MessageSize', label: 'Message Size', format: 'filesize' },
	{ key: 'OpenTrackedCount', label: 'Open Tracked Count', format: 'number' },
	{ key: 'QueuedCount', label: 'Queued Count', format: 'number' },
	{ key: 'SendEndAt', label: 'Send End At', format: 'datetime' },
	{ key: 'SentCount', label: 'Sent Count', format: 'number' },
	{
		key: 'SpamAssassinRules',
		label: 'SpamAssassin Rules',
		children: [
			{ key: 'ALT', label: 'ALT' },
			{ key: 'ID', label: 'ID', format: 'number' },
		],
	},
	{ key: 'SpamAssassinScore', label: 'SpamAssassin Score', format: 'number' },
];

export const mailjetMessageOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Messages',
	labelKey: 'Subject',
	fields: messageFields,
});

export const mailjetClickOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Clicks',
	labelKey: 'Url',
	fields: clickFields,
});

export const mailjetOpenOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Opens',
	labelKey: 'OpenedAt',
	fields: openFields,
});

export const mailjetBounceOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Bounces',
});

export const mailjetMessageHistoryOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Events',
	labelKey: 'EventType',
	fields: messageHistoryFields,
});

export const mailjetMessageInformationOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Messages',
	labelKey: 'ID',
	fields: messageInformationFields,
});
