import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const warningFields: OutputSchemaField[] = [
	{ key: 'message', label: 'Message' },
	{ key: 'code', label: 'Code', description: 'For example CUSTOM_FIELDS_UNKNOWN when a custom field name does not exist.' },
];

const subscriptionFields: OutputSchemaField[] = [
	{ key: 'id', label: 'Subscription ID' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'status', label: 'Status', description: 'validating, invalid, pending, active, inactive, needs_attention, paused or unset.' },
	{ key: 'created', label: 'Created (Unix Seconds)', format: 'number' },
	{ key: 'subscription_tier', label: 'Tier', description: 'free or premium.' },
	{ key: 'subscription_premium_tier_names', label: 'Premium Tier Names' },
	{
		key: 'subscription_premium_tiers',
		label: 'Premium Tiers',
		labelKey: 'name',
		description: 'Present only when expanded.',
		listItems: [
			{ key: 'id', label: 'Tier ID' },
			{ key: 'name', label: 'Name' },
			{ key: 'status', label: 'Status' },
		],
	},
	{ key: 'utm_source', label: 'UTM Source' },
	{ key: 'utm_medium', label: 'UTM Medium' },
	{ key: 'utm_channel', label: 'UTM Channel', description: 'How the subscriber joined, for example website, api, import or referral.' },
	{ key: 'utm_campaign', label: 'UTM Campaign' },
	{ key: 'utm_term', label: 'UTM Term' },
	{ key: 'utm_content', label: 'UTM Content' },
	{ key: 'referring_site', label: 'Referring Site' },
	{ key: 'referral_code', label: 'Referral Code' },
	{ key: 'stripe_customer_id', label: 'Stripe Customer ID' },
	{
		key: 'custom_fields',
		label: 'Custom Fields',
		labelKey: 'name',
		description: 'Present only when custom fields are expanded or were just written.',
		listItems: [
			{ key: 'name', label: 'Name' },
			{ key: 'kind', label: 'Kind' },
			{ key: 'value', label: 'Value' },
		],
	},
	{ key: 'tags', label: 'Tags', description: 'Present only when tags are expanded or were just changed.' },
	{ key: 'newsletter_list_ids', label: 'Newsletter List IDs', description: 'Present only when newsletter lists are expanded.' },
	{ key: 'referrals', label: 'Referrals', description: 'Subscribers this subscriber referred. Present only when referrals are expanded.' },
	{
		key: 'stats',
		label: 'Stats',
		description: 'Present only when stats are expanded.',
		children: [
			{ key: 'total_sent', label: 'Emails Sent', format: 'number' },
			{ key: 'total_received', label: 'Emails Received', format: 'number' },
			{ key: 'total_unique_opened', label: 'Unique Opens', format: 'number' },
			{ key: 'total_clicked', label: 'Clicks', format: 'number' },
			{ key: 'total_unique_clicked', label: 'Unique Clicks', format: 'number' },
			{ key: 'open_rate', label: 'Open Rate', format: 'number' },
			{ key: 'click_rate', label: 'Click Rate', format: 'number' },
		],
	},
];

const postStatsFields: OutputSchemaField[] = [
	{
		key: 'email',
		label: 'Email',
		children: [
			{ key: 'recipients', label: 'Recipients', format: 'number' },
			{ key: 'delivered', label: 'Delivered', format: 'number' },
			{ key: 'opens', label: 'Opens', format: 'number' },
			{ key: 'unique_opens', label: 'Unique Opens', format: 'number' },
			{ key: 'open_rate', label: 'Open Rate', format: 'number' },
			{ key: 'clicks', label: 'Clicks', format: 'number' },
			{ key: 'unique_clicks', label: 'Unique Clicks', format: 'number' },
			{ key: 'verified_clicks', label: 'Verified Clicks', format: 'number' },
			{ key: 'unique_verified_clicks', label: 'Unique Verified Clicks', format: 'number' },
			{ key: 'click_rate', label: 'Click Rate', format: 'number' },
			{ key: 'unsubscribes', label: 'Unsubscribes', format: 'number' },
			{ key: 'spam_reports', label: 'Spam Reports', format: 'number' },
		],
	},
	{
		key: 'web',
		label: 'Web',
		children: [
			{ key: 'views', label: 'Views', format: 'number' },
			{ key: 'clicks', label: 'Clicks', format: 'number' },
		],
	},
	{
		key: 'clicks',
		label: 'Link Clicks',
		labelKey: 'url',
		listItems: [
			{ key: 'url', label: 'URL', format: 'url' },
			{ key: 'total_clicks', label: 'Total Clicks', format: 'number' },
			{ key: 'total_unique_clicks', label: 'Unique Clicks', format: 'number' },
			{ key: 'total_click_through_rate', label: 'Click Through Rate', format: 'number' },
		],
	},
	{ key: 'upgrades', label: 'Upgrades', format: 'number' },
];

const postFields: OutputSchemaField[] = [
	{ key: 'id', label: 'Post ID' },
	{ key: 'title', label: 'Title' },
	{ key: 'subtitle', label: 'Subtitle' },
	{ key: 'authors', label: 'Authors' },
	{ key: 'created', label: 'Created (Unix Seconds)', format: 'number' },
	{ key: 'status', label: 'Status', description: 'draft, confirmed (published or scheduled) or archived.' },
	{ key: 'publish_date', label: 'Publish Date (Unix Seconds)', format: 'number' },
	{ key: 'displayed_date', label: 'Displayed Date (Unix Seconds)', format: 'number' },
	{ key: 'split_tested', label: 'Split Tested', format: 'boolean' },
	{ key: 'subject_line', label: 'Subject Line' },
	{ key: 'preview_text', label: 'Preview Text' },
	{ key: 'slug', label: 'Slug' },
	{ key: 'thumbnail_url', label: 'Thumbnail', format: 'image' },
	{ key: 'web_url', label: 'Web URL', format: 'url' },
	{ key: 'audience', label: 'Audience', description: 'free, premium or both.' },
	{ key: 'platform', label: 'Platform', description: 'web, email or both.' },
	{ key: 'content_tags', label: 'Content Tags' },
	{ key: 'hidden_from_feed', label: 'Hidden From Feed', format: 'boolean' },
	{ key: 'meta_default_title', label: 'SEO Title' },
	{ key: 'meta_default_description', label: 'SEO Description' },
	{ key: 'stats', label: 'Stats', description: 'Present only when stats are requested.', children: postStatsFields },
	{
		key: 'content',
		label: 'Content',
		description: 'Present only when content is requested.',
		children: [
			{
				key: 'free',
				label: 'Free',
				children: [
					{ key: 'web', label: 'Web HTML', format: 'html' },
					{ key: 'email', label: 'Email HTML', format: 'html' },
					{ key: 'rss', label: 'RSS HTML', format: 'html' },
				],
			},
			{
				key: 'premium',
				label: 'Premium',
				children: [
					{ key: 'web', label: 'Web HTML', format: 'html' },
					{ key: 'email', label: 'Email HTML', format: 'html' },
				],
			},
		],
	},
];

const automationFields: OutputSchemaField[] = [
	{ key: 'id', label: 'Automation ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'status', label: 'Status', description: 'running, finishing, inactive, live or draft.' },
	{ key: 'trigger_events', label: 'Trigger Events', description: 'Only automations whose trigger events include "api" accept subscribers from the API.' },
	{ key: 'description', label: 'Description' },
	{ key: 'newsletter_list_id', label: 'Newsletter List ID', description: 'Empty when the automation is not tied to a newsletter list.' },
];

const journeyFields: OutputSchemaField[] = [
	{ key: 'id', label: 'Journey ID' },
	{ key: 'automation_id', label: 'Automation ID' },
	{ key: 'subscription_id', label: 'Subscription ID' },
	{ key: 'status', label: 'Status', description: 'in_progress, completed, exited_early or manually_removed.' },
	{ key: 'started_at', label: 'Started At (Unix Seconds)', format: 'number' },
	{ key: 'completed_at', label: 'Completed At (Unix Seconds)', format: 'number' },
];

const publicationFields: OutputSchemaField[] = [
	{ key: 'id', label: 'Publication ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'organization_name', label: 'Organization' },
	{ key: 'referral_program_enabled', label: 'Referral Program Enabled', format: 'boolean' },
	{ key: 'created', label: 'Created (Unix Seconds)', format: 'number' },
	{
		key: 'stats',
		label: 'Stats',
		description: 'Present only when stats are requested.',
		children: [
			{ key: 'active_subscriptions', label: 'Active Subscriptions', format: 'number' },
			{ key: 'active_premium_subscriptions', label: 'Active Premium Subscriptions', format: 'number' },
			{ key: 'active_free_subscriptions', label: 'Active Free Subscriptions', format: 'number' },
			{ key: 'average_open_rate', label: 'Average Open Rate', format: 'number' },
			{ key: 'average_click_rate', label: 'Average Click Rate', format: 'number' },
			{ key: 'total_sent', label: 'Total Sent', format: 'number' },
			{ key: 'total_delivered', label: 'Total Delivered', format: 'number' },
			{ key: 'total_unique_opened', label: 'Total Unique Opened', format: 'number' },
			{ key: 'total_clicked', label: 'Total Clicked', format: 'number' },
		],
	},
];

const customFieldFields: OutputSchemaField[] = [
	{ key: 'id', label: 'Custom Field ID' },
	{ key: 'display', label: 'Name', description: 'Use this name as the key in Custom Fields of Create/Update Subscription (AI).' },
	{ key: 'kind', label: 'Kind', description: 'string, integer, double, boolean, date, datetime or list.' },
	{ key: 'created', label: 'Created (Unix Seconds)', format: 'number' },
	{ key: 'options', label: 'Options', description: 'Allowed values; present only for list fields.' },
];

const segmentFields: OutputSchemaField[] = [
	{ key: 'id', label: 'Segment ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'type', label: 'Type', description: 'dynamic, static or manual.' },
	{ key: 'status', label: 'Status', description: 'pending, processing, completed or failed.' },
	{ key: 'active', label: 'Active', format: 'boolean' },
	{ key: 'total_results', label: 'Members', format: 'number' },
	{ key: 'last_calculated', label: 'Last Calculated (Unix Seconds)', format: 'number' },
];

const tierFields: OutputSchemaField[] = [
	{ key: 'id', label: 'Tier ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'status', label: 'Status', description: 'active or archived.' },
	{ key: 'description', label: 'Description' },
	{
		key: 'prices',
		label: 'Prices',
		labelKey: 'interval',
		description: 'Present only when prices are requested.',
		listItems: [
			{ key: 'id', label: 'Price ID' },
			{ key: 'currency', label: 'Currency' },
			{ key: 'amount_cents', label: 'Amount (Cents)', format: 'number' },
			{ key: 'interval', label: 'Interval' },
			{ key: 'enabled', label: 'Enabled', format: 'boolean' },
		],
	},
];

const newsletterListFields: OutputSchemaField[] = [
	{ key: 'id', label: 'Newsletter List ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'slug', label: 'Slug' },
	{ key: 'description', label: 'Description' },
	{ key: 'status', label: 'Status', description: 'draft, active or archived.' },
	{ key: 'auto_subscribe', label: 'Auto Subscribe', format: 'boolean' },
	{ key: 'show_in_preference_center', label: 'Shown In Preference Center', format: 'boolean' },
	{ key: 'subscriber_count', label: 'Subscribers', format: 'number' },
	{ key: 'created_at', label: 'Created At (Unix Seconds)', format: 'number' },
	{ key: 'updated_at', label: 'Updated At (Unix Seconds)', format: 'number' },
	{ key: 'tier_ids', label: 'Tier IDs' },
];

const postTemplateFields: OutputSchemaField[] = [
	{ key: 'id', label: 'Template ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'created', label: 'Created (Unix Seconds)', format: 'number' },
	{ key: 'updated', label: 'Updated (Unix Seconds)', format: 'number' },
];

const offsetPagingFields: OutputSchemaField[] = [
	{ key: 'page', label: 'Page', format: 'number' },
	{ key: 'limit', label: 'Limit', format: 'number' },
	{ key: 'total_pages', label: 'Total Pages', format: 'number' },
	{ key: 'total_results', label: 'Total Results', format: 'number' },
	{ key: 'has_more', label: 'Has More', format: 'boolean', description: 'True when a later page exists; call again with Page + 1.' },
];

function offsetList({ label, labelKey, fields }: { label: string; labelKey: string; fields: OutputSchemaField[] }): OutputSchema {
	return {
		fields: [{ key: 'items', label, labelKey, listItems: fields }, ...offsetPagingFields],
	};
}

function topLevelArray({ label, itemLabel, fields }: { label: string; itemLabel: string; fields: OutputSchemaField[] }): OutputSchema {
	return {
		itemLabel,
		fields: [{ key: 'items', label, value: '', listItems: fields }],
	};
}

export const beehiivOutputSchemas = {
	subscriptionPayload: { fields: subscriptionFields } satisfies OutputSchema,
	postPayload: { fields: postFields } satisfies OutputSchema,
	humanCreateOrUpdateSubscription: {
		fields: [
			{ key: 'data', label: 'Subscription', children: subscriptionFields },
			{ key: 'warnings', label: 'Warnings', labelKey: 'code', listItems: warningFields },
		],
	} satisfies OutputSchema,
	humanDeleteSubscription: {
		fields: [
			{ key: 'deleted', label: 'Deleted', format: 'boolean' },
			{ key: 'subscription_id', label: 'Subscription ID' },
		],
	} satisfies OutputSchema,
	humanListSubscriptions: topLevelArray({ label: 'Subscriptions', itemLabel: '{email}', fields: subscriptionFields }),
	humanAddToAutomation: {
		fields: journeyFields,
	} satisfies OutputSchema,
	humanListAutomations: topLevelArray({ label: 'Automations', itemLabel: '{name}', fields: automationFields }),
	humanListPosts: {
		fields: [
			{ key: 'items', label: 'Posts', labelKey: 'title', listItems: postFields },
			{ key: 'page', label: 'Page (Limit/Page mode)', format: 'number' },
			{ key: 'limit', label: 'Limit (Limit/Page mode)', format: 'number' },
			{ key: 'total_pages', label: 'Total Pages (Limit/Page mode)', format: 'number' },
			{ key: 'total_results', label: 'Total Results', format: 'number' },
			{ key: 'has_more', label: 'Has More', format: 'boolean', description: 'True when a later page exists; call again with Page + 1. Always false when all results are returned.' },
		],
	} satisfies OutputSchema,
	listPublications: offsetList({ label: 'Publications', labelKey: 'name', fields: publicationFields }),
	listSubscriptions: {
		fields: [
			{ key: 'items', label: 'Subscriptions', labelKey: 'email', listItems: subscriptionFields },
			{ key: 'next_cursor', label: 'Next Cursor', description: 'Pass as Cursor to get the next page; empty when there are no more.' },
			{ key: 'has_more', label: 'Has More', format: 'boolean' },
		],
	} satisfies OutputSchema,
	getSubscription: { fields: subscriptionFields } satisfies OutputSchema,
	writeSubscription: {
		fields: [
			{ key: 'subscription', label: 'Subscription', children: subscriptionFields },
			{ key: 'warnings', label: 'Warnings', labelKey: 'code', listItems: warningFields },
		],
	} satisfies OutputSchema,
	unsubscribe: {
		fields: [{ key: 'subscription', label: 'Subscription', children: subscriptionFields }],
	} satisfies OutputSchema,
	deleteSubscription: {
		fields: [
			{ key: 'deleted', label: 'Deleted', format: 'boolean' },
			{ key: 'subscription_id', label: 'Subscription ID' },
		],
	} satisfies OutputSchema,
	addTags: {
		fields: [
			{ key: 'subscription', label: 'Subscription', children: subscriptionFields },
			{ key: 'added_tags', label: 'Added Tags' },
		],
	} satisfies OutputSchema,
	removeTags: {
		fields: [
			{ key: 'subscription_id', label: 'Subscription ID' },
			{ key: 'removed_tags', label: 'Removed Tags', description: 'Tags requested for removal; tags the subscriber did not have are ignored by beehiiv.' },
		],
	} satisfies OutputSchema,
	listCustomFields: offsetList({ label: 'Custom Fields', labelKey: 'display', fields: customFieldFields }),
	createCustomField: { fields: customFieldFields } satisfies OutputSchema,
	listTiers: offsetList({ label: 'Tiers', labelKey: 'name', fields: tierFields }),
	listNewsletterLists: offsetList({ label: 'Newsletter Lists', labelKey: 'name', fields: newsletterListFields }),
	listSegments: offsetList({ label: 'Segments', labelKey: 'name', fields: segmentFields }),
	createSegment: { fields: segmentFields } satisfies OutputSchema,
	listSegmentMembers: offsetList({ label: 'Members', labelKey: 'email', fields: subscriptionFields }),
	getPost: { fields: postFields } satisfies OutputSchema,
	aggregatePostStats: {
		fields: [
			{ key: 'computed_at', label: 'Computed At (Unix Seconds)', format: 'number' },
			{ key: 'stats', label: 'Stats', children: postStatsFields },
		],
	} satisfies OutputSchema,
	deletePost: {
		fields: [
			{ key: 'post_id', label: 'Post ID' },
			{ key: 'result', label: 'Result', description: 'deleted (draft removed), archived (published post archived) or pending (beehiiv is still processing).' },
			{ key: 'previous_status', label: 'Status Before Delete' },
		],
	} satisfies OutputSchema,
	createDraftPost: {
		fields: [
			{ key: 'id', label: 'Post ID' },
			{ key: 'preview_url', label: 'Preview URL', format: 'url' },
			{ key: 'status', label: 'Status' },
		],
	} satisfies OutputSchema,
	listPostTemplates: offsetList({ label: 'Post Templates', labelKey: 'name', fields: postTemplateFields }),
	engagements: {
		fields: [
			{ key: 'publication_id', label: 'Publication ID' },
			{ key: 'granularity', label: 'Granularity' },
			{ key: 'email_type', label: 'Email Type' },
			{ key: 'start_date', label: 'Start Date', format: 'date' },
			{ key: 'number_of_days', label: 'Number Of Days', format: 'number' },
			{
				key: 'items',
				label: 'Engagement By Period',
				labelKey: 'date',
				listItems: [
					{ key: 'date', label: 'Date', format: 'date' },
					{ key: 'total_opens', label: 'Opens', format: 'number' },
					{ key: 'unique_opens', label: 'Unique Opens', format: 'number' },
					{ key: 'total_clicks', label: 'Clicks', format: 'number' },
					{ key: 'unique_clicks', label: 'Unique Clicks', format: 'number' },
					{ key: 'total_verified_clicks', label: 'Verified Clicks', format: 'number' },
					{ key: 'unique_verified_clicks', label: 'Unique Verified Clicks', format: 'number' },
				],
			},
		],
	} satisfies OutputSchema,
	unsubscribePayload: {
		fields: [
			...subscriptionFields,
			{ key: 'unsubscribed_at', label: 'Unsubscribed At (Unix Seconds)', format: 'number' },
			{ key: 'unsubscribe_source', label: 'Unsubscribe Source', description: 'Empty when the subscription was deleted rather than unsubscribed.' },
		],
	} satisfies OutputSchema,
};
