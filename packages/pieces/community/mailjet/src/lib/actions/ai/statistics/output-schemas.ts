import { OutputSchema } from '@activepieces/pieces-framework';

import { mailjetSchemaUtils } from '../../../output-schemas';

const campaignOverviewFields: OutputSchema['fields'] = [
	{ key: 'ClickedCount', label: 'Clicked Count', format: 'number' },
	{ key: 'DeliveredCount', label: 'Delivered Count', format: 'number' },
	{ key: 'EditMode', label: 'Edit Mode' },
	{ key: 'EditType', label: 'Edit Type' },
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'IDType', label: 'IDType' },
	{ key: 'OpenedCount', label: 'Opened Count', format: 'number' },
	{ key: 'ProcessedCount', label: 'Processed Count', format: 'number' },
	{ key: 'SendTimeStart', label: 'Send Time Start', format: 'number' },
	{ key: 'Starred', label: 'Starred', format: 'boolean' },
	{ key: 'Status', label: 'Status', format: 'number' },
	{ key: 'Subject', label: 'Subject' },
	{ key: 'Title', label: 'Title' },
];

const contactStatisticsFields: OutputSchema['fields'] = [
	{ key: 'BlockedCount', label: 'Blocked Count', format: 'number' },
	{ key: 'BouncedCount', label: 'Bounced Count', format: 'number' },
	{ key: 'ClickedCount', label: 'Clicked Count', format: 'number' },
	{ key: 'ContactID', label: 'Contact ID', format: 'number' },
	{ key: 'DeferredCount', label: 'Deferred Count', format: 'number' },
	{ key: 'DeliveredCount', label: 'Delivered Count', format: 'number' },
	{ key: 'HardBouncedCount', label: 'Hard Bounced Count', format: 'number' },
	{ key: 'LastActivityAt', label: 'Last Activity At', format: 'datetime' },
	{ key: 'MarketingContacts', label: 'Marketing Contacts', format: 'number' },
	{ key: 'OpenedCount', label: 'Opened Count', format: 'number' },
	{ key: 'PreQueuedCount', label: 'Pre Queued Count', format: 'number' },
	{ key: 'ProcessedCount', label: 'Processed Count', format: 'number' },
	{ key: 'QueuedCount', label: 'Queued Count', format: 'number' },
	{ key: 'SoftBouncedCount', label: 'Soft Bounced Count', format: 'number' },
	{ key: 'SpamComplaintCount', label: 'Spam Complaint Count', format: 'number' },
	{ key: 'UnsubscribedCount', label: 'Unsubscribed Count', format: 'number' },
	{ key: 'UserMarketingContacts', label: 'User Marketing Contacts', format: 'number' },
	{ key: 'WorkFlowExitedCount', label: 'Work Flow Exited Count', format: 'number' },
];

const statCountersFields: OutputSchema['fields'] = [
	{ key: 'APIKeyID', label: 'APIKey ID', format: 'number' },
	{ key: 'EventClickDelay', label: 'Event Click Delay', format: 'duration' },
	{ key: 'EventClickedCount', label: 'Event Clicked Count', format: 'number' },
	{ key: 'EventOpenDelay', label: 'Event Open Delay', format: 'duration' },
	{ key: 'EventOpenedCount', label: 'Event Opened Count', format: 'number' },
	{ key: 'EventSpamCount', label: 'Event Spam Count', format: 'number' },
	{ key: 'EventUnsubscribedCount', label: 'Event Unsubscribed Count', format: 'number' },
	{ key: 'EventWorkflowExitedCount', label: 'Event Workflow Exited Count', format: 'number' },
	{ key: 'MessageBlockedCount', label: 'Message Blocked Count', format: 'number' },
	{ key: 'MessageClickedCount', label: 'Message Clicked Count', format: 'number' },
	{ key: 'MessageDeferredCount', label: 'Message Deferred Count', format: 'number' },
	{ key: 'MessageHardBouncedCount', label: 'Message Hard Bounced Count', format: 'number' },
	{ key: 'MessageOpenedCount', label: 'Message Opened Count', format: 'number' },
	{ key: 'MessageQueuedCount', label: 'Message Queued Count', format: 'number' },
	{ key: 'MessageSentCount', label: 'Message Sent Count', format: 'number' },
	{ key: 'MessageSoftBouncedCount', label: 'Message Soft Bounced Count', format: 'number' },
	{ key: 'MessageSpamCount', label: 'Message Spam Count', format: 'number' },
	{ key: 'MessageUnsubscribedCount', label: 'Message Unsubscribed Count', format: 'number' },
	{ key: 'MessageWorkFlowExitedCount', label: 'Message Work Flow Exited Count', format: 'number' },
	{ key: 'SourceID', label: 'Source ID', format: 'number' },
	{ key: 'Timeslice', label: 'Timeslice', format: 'datetime' },
	{ key: 'Total', label: 'Total', format: 'number' },
];

const recipientEspStatisticsFields: OutputSchema['fields'] = [
	{ key: 'ESPName', label: 'Mailbox Provider' },
	{ key: 'DeliveredMessagesCount', label: 'Delivered Messages Count', format: 'number' },
	{ key: 'AttemptedMessagesCount', label: 'Attempted Messages Count', format: 'number' },
	{ key: 'OpenedMessagesCount', label: 'Opened Messages Count', format: 'number' },
	{ key: 'ClickedMessagesCount', label: 'Clicked Messages Count', format: 'number' },
	{ key: 'DeferredMessagesCount', label: 'Deferred Messages Count', format: 'number' },
	{ key: 'SoftBouncedMessagesCount', label: 'Soft Bounced Messages Count', format: 'number' },
	{ key: 'HardBouncedMessagesCount', label: 'Hard Bounced Messages Count', format: 'number' },
	{ key: 'UnsubscribedMessagesCount', label: 'Unsubscribed Messages Count', format: 'number' },
	{ key: 'SpamReportsCount', label: 'Spam Reports Count', format: 'number' },
	{ key: 'OpenRate', label: 'Open Rate', format: 'number' },
	{ key: 'ClickThroughRate', label: 'Click Through Rate', format: 'number' },
	{ key: 'SoftBouncedRate', label: 'Soft Bounced Rate', format: 'number' },
	{ key: 'HardBouncedRate', label: 'Hard Bounced Rate', format: 'number' },
	{ key: 'UnsubscribedRate', label: 'Unsubscribed Rate', format: 'number' },
	{ key: 'SpamReportsRate', label: 'Spam Reports Rate', format: 'number' },
	{ key: 'DeferredRate', label: 'Deferred Rate', format: 'number' },
];

const geoStatisticsFields: OutputSchema['fields'] = [
	{ key: 'ClickedCount', label: 'Clicked Count', format: 'number' },
	{ key: 'Country', label: 'Country' },
	{ key: 'OpenedCount', label: 'Opened Count', format: 'number' },
];

const linkClickStatisticsFields: OutputSchema['fields'] = [
	{ key: 'URL', label: 'URL', format: 'url' },
	{ key: 'PositionIndex', label: 'Position Index', format: 'number' },
	{ key: 'ClickedMessagesCount', label: 'Clicked Messages Count', format: 'number' },
	{ key: 'ClickedEventsCount', label: 'Clicked Events Count', format: 'number' },
];

const topLinksFields: OutputSchema['fields'] = [
	{ key: 'ClickedCount', label: 'Clicked Count', format: 'number' },
	{ key: 'LinkId', label: 'Link ID', format: 'number' },
	{ key: 'Url', label: 'URL' },
];

const userAgentStatisticsFields: OutputSchema['fields'] = [
	{ key: 'Count', label: 'Count', format: 'number' },
	{ key: 'DistinctCount', label: 'Distinct Count', format: 'number' },
	{ key: 'Platform', label: 'Platform' },
	{ key: 'UserAgent', label: 'User Agent' },
];

const subscriptionStatisticsFields: OutputSchema['fields'] = [
	{ key: 'BlockedCount', label: 'Blocked Count', format: 'number' },
	{ key: 'BouncedCount', label: 'Bounced Count', format: 'number' },
	{ key: 'ClickedCount', label: 'Clicked Count', format: 'number' },
	{ key: 'DeferredCount', label: 'Deferred Count', format: 'number' },
	{ key: 'DeliveredCount', label: 'Delivered Count', format: 'number' },
	{ key: 'HardBouncedCount', label: 'Hard Bounced Count', format: 'number' },
	{ key: 'LastActivityAt', label: 'Last Activity At', format: 'datetime' },
	{ key: 'ListRecipientID', label: 'List Recipient ID', format: 'number' },
	{ key: 'OpenedCount', label: 'Opened Count', format: 'number' },
	{ key: 'PreQueuedCount', label: 'Pre Queued Count', format: 'number' },
	{ key: 'ProcessedCount', label: 'Processed Count', format: 'number' },
	{ key: 'QueuedCount', label: 'Queued Count', format: 'number' },
	{ key: 'SoftBouncedCount', label: 'Soft Bounced Count', format: 'number' },
	{ key: 'SpamComplaintCount', label: 'Spam Complaint Count', format: 'number' },
	{ key: 'UnsubscribedCount', label: 'Unsubscribed Count', format: 'number' },
	{ key: 'WorkFlowExitedCount', label: 'Work Flow Exited Count', format: 'number' },
];

export const mailjetCampaignOverviewOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Campaign Overviews',
	labelKey: 'Subject',
	fields: campaignOverviewFields,
});

export const mailjetContactStatisticsOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Contact Statistics',
	labelKey: 'ContactID',
	fields: contactStatisticsFields,
});

export const mailjetStatCountersOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Counters',
	labelKey: 'Timeslice',
	fields: statCountersFields,
});

export const mailjetRecipientEspStatisticsOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Mailbox Providers',
	labelKey: 'ESPName',
	fields: recipientEspStatisticsFields,
});

export const mailjetGeoStatisticsOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Countries',
	labelKey: 'Country',
	fields: geoStatisticsFields,
});

export const mailjetLinkClickStatisticsOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Links',
	labelKey: 'URL',
	fields: linkClickStatisticsFields,
});

export const mailjetTopLinksOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Links',
	labelKey: 'Url',
	fields: topLinksFields,
});

export const mailjetUserAgentStatisticsOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'User Agents',
	labelKey: 'UserAgent',
	fields: userAgentStatisticsFields,
});

export const mailjetSubscriptionStatisticsOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Subscription Statistics',
	labelKey: 'ListRecipientID',
	fields: subscriptionStatisticsFields,
});
