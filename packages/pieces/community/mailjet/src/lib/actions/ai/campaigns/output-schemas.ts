import { OutputSchema } from '@activepieces/pieces-framework';

import { mailjetSchemaUtils } from '../../../output-schemas';

const campaignDraftFields: OutputSchema['fields'] = [
	{ key: 'AXFraction', label: 'A/B Test Fraction', format: 'number' },
	{ key: 'AXFractionName', label: 'A/B Test Fraction Name' },
	{ key: 'ContactsListID', label: 'Contacts List ID', format: 'number' },
	{ key: 'CreatedAt', label: 'Created At', format: 'datetime' },
	{ key: 'Current', label: 'Current', format: 'number' },
	{ key: 'DeliveredAt', label: 'Delivered At', format: 'datetime' },
	{ key: 'EditMode', label: 'Edit Mode' },
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'IsCampaignTemplate', label: 'Is Campaign Template', format: 'boolean' },
	{ key: 'IsStarred', label: 'Is Starred', format: 'boolean' },
	{ key: 'IsTextPartIncluded', label: 'Is Text Part Included', format: 'boolean' },
	{ key: 'Locale', label: 'Locale' },
	{ key: 'ModifiedAt', label: 'Modified At' },
	{ key: 'Preset', label: 'Preset' },
	{ key: 'ReplyEmail', label: 'Reply Email', format: 'email' },
	{ key: 'SegmentationID', label: 'Segmentation ID', format: 'number' },
	{ key: 'Sender', label: 'Sender' },
	{ key: 'SenderEmail', label: 'Sender Email', format: 'email' },
	{ key: 'SenderName', label: 'Sender Name' },
	{ key: 'Status', label: 'Status', format: 'number' },
	{ key: 'Subject', label: 'Subject' },
	{ key: 'Title', label: 'Title' },
	{ key: 'Url', label: 'URL', format: 'url' },
	{ key: 'Used', label: 'Used', format: 'boolean' },
	{ key: 'VarCount', label: 'Var Count', format: 'number' },
];

const campaignFields: OutputSchema['fields'] = [
	{ key: 'CampaignType', label: 'Campaign Type', format: 'number' },
	{ key: 'ClickTracked', label: 'Click Tracked', format: 'number' },
	{ key: 'CreatedAt', label: 'Created At', format: 'datetime' },
	{ key: 'CustomValue', label: 'Custom Value' },
	{ key: 'FirstMessageID', label: 'First Message ID' },
	{ key: 'FromEmail', label: 'From Email', format: 'email' },
	{ key: 'FromID', label: 'From ID', format: 'number' },
	{ key: 'FromName', label: 'From Name' },
	{ key: 'HasHtmlCount', label: 'Has HTML Count', format: 'number' },
	{ key: 'HasTxtCount', label: 'Has Txt Count', format: 'number' },
	{ key: 'ID', label: 'ID', format: 'number' },
	{ key: 'IsDeleted', label: 'Is Deleted', format: 'boolean' },
	{ key: 'IsStarred', label: 'Is Starred', format: 'boolean' },
	{ key: 'ListID', label: 'List ID', format: 'number' },
	{ key: 'NewsLetterID', label: 'Campaign Draft ID', format: 'number' },
	{ key: 'OpenTracked', label: 'Open Tracked', format: 'number' },
	{ key: 'SegmentationID', label: 'Segmentation ID', format: 'number' },
	{ key: 'SendEndAt', label: 'Send End At', format: 'datetime' },
	{ key: 'SendStartAt', label: 'Send Start At', format: 'datetime' },
	{ key: 'SpamassScore', label: 'SpamAssassin Score', format: 'number' },
	{ key: 'Status', label: 'Status', format: 'number' },
	{ key: 'Subject', label: 'Subject' },
	{ key: 'UnsubscribeTrackedCount', label: 'Unsubscribe Tracked Count', format: 'number' },
];

const campaignDraftContentFields: OutputSchema['fields'] = [
	{ key: 'Html-part', label: 'HTML Part' },
	{ key: 'Text-part', label: 'Text Part' },
];

const campaignDraftScheduleFields: OutputSchema['fields'] = [
	{ key: 'Date', label: 'Date', format: 'datetime' },
	{ key: 'Status', label: 'Status' },
];

const campaignDraftStatusFields: OutputSchema['fields'] = [{ key: 'Status', label: 'Status' }];

export const mailjetCampaignDraftOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Campaign Drafts',
	labelKey: 'Subject',
	fields: campaignDraftFields,
});

export const mailjetCampaignDraftWithTemplateOutputSchema: OutputSchema =
	mailjetSchemaUtils.envelope({
		label: 'Campaign Drafts',
		labelKey: 'Subject',
		fields: [...campaignDraftFields, { key: 'TemplateID', label: 'Template ID', format: 'number' }],
	});

export const mailjetCampaignOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Campaigns',
	labelKey: 'Subject',
	fields: campaignFields,
});

export const mailjetCampaignDraftContentOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Content',
	fields: campaignDraftContentFields,
});

export const mailjetSetCampaignDraftContentOutputSchema: OutputSchema = mailjetSchemaUtils.envelope(
	{
		label: 'Content',
		fields: [
			...campaignDraftContentFields,
			{ key: 'created_at', label: 'Created At', format: 'number' },
		],
	},
);

export const mailjetCampaignDraftScheduleOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Schedule',
	labelKey: 'Status',
	fields: campaignDraftScheduleFields,
});

export const mailjetCampaignDraftStatusOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Status',
	labelKey: 'Status',
	fields: campaignDraftStatusFields,
});
