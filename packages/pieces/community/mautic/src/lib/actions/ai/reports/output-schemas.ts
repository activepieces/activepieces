import { OutputSchema } from '@activepieces/pieces-framework';

import { reportFiltersFields, reportsFields } from '../../../output-schemas';

export const mauticCreateReportOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'report',
			label: 'Report',
			children: [
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'description', label: 'Description' },
				{ key: 'system', label: 'System', format: 'boolean' },
				{ key: 'isScheduled', label: 'Is Scheduled', format: 'boolean' },
				{ key: 'source', label: 'Source' },
				{ key: 'columns', label: 'Columns' },
				{ key: 'filters', label: 'Filters', listItems: reportFiltersFields },
				{ key: 'tableOrder', label: 'Table Order' },
				{ key: 'graphs', label: 'Graphs' },
				{ key: 'groupBy', label: 'Group By' },
				{
					key: 'settings',
					label: 'Settings',
					children: [
						{ key: 'showGraphsAboveTable', label: 'Show Graphs Above Table' },
						{ key: 'showDynamicFilters', label: 'Show Dynamic Filters' },
						{ key: 'hideDateRangeFilter', label: 'Hide Date Range Filter' },
					],
				},
				{ key: 'aggregators', label: 'Aggregators' },
				{ key: 'scheduleUnit', label: 'Schedule Unit' },
				{ key: 'toAddress', label: 'To Address' },
				{ key: 'scheduleDay', label: 'Schedule Day' },
				{ key: 'scheduleMonthFrequency', label: 'Schedule Month Frequency' },
			],
		},
	],
};

export const mauticDeleteReportOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'report',
			label: 'Report',
			children: [
				{ key: 'id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'description', label: 'Description' },
				{ key: 'system', label: 'System', format: 'boolean' },
				{ key: 'isScheduled', label: 'Is Scheduled', format: 'boolean' },
				{ key: 'source', label: 'Source' },
				{ key: 'columns', label: 'Columns' },
				{ key: 'filters', label: 'Filters', listItems: reportFiltersFields },
				{ key: 'tableOrder', label: 'Table Order' },
				{ key: 'graphs', label: 'Graphs' },
				{ key: 'groupBy', label: 'Group By' },
				{
					key: 'settings',
					label: 'Settings',
					children: [
						{ key: 'showDynamicFilters', label: 'Show Dynamic Filters' },
						{ key: 'hideDateRangeFilter', label: 'Hide Date Range Filter' },
						{ key: 'showGraphsAboveTable', label: 'Show Graphs Above Table' },
					],
				},
				{ key: 'aggregators', label: 'Aggregators' },
				{ key: 'scheduleUnit', label: 'Schedule Unit' },
				{ key: 'toAddress', label: 'To Address' },
				{ key: 'scheduleDay', label: 'Schedule Day' },
				{ key: 'scheduleMonthFrequency', label: 'Schedule Month Frequency' },
			],
		},
	],
};

export const mauticGetDashboardWidgetDataOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'number' },
		{ key: 'cached', label: 'Cached', format: 'boolean' },
		{ key: 'execution_time', label: 'Execution Time', format: 'number' },
		{ key: 'data', label: 'Data' },
	],
};

export const mauticGetReportOutputSchema: OutputSchema = {
	fields: [
		{ key: 'totalResults', label: 'Total Results', format: 'number' },
		{ key: 'data', label: 'Data' },
		{ key: 'dataColumns', label: 'Data Columns', dynamicKey: true },
		{ key: 'limit', label: 'Limit', format: 'number' },
		{ key: 'page', label: 'Page', format: 'number' },
		{ key: 'debug', label: 'Debug' },
		{ key: 'aggregatorColumns', label: 'Aggregator Columns' },
		{
			key: 'report',
			label: 'Report',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'description', label: 'Description' },
				{ key: 'system', label: 'System', format: 'boolean' },
				{ key: 'isScheduled', label: 'Is Scheduled', format: 'boolean' },
				{ key: 'source', label: 'Source' },
				{ key: 'columns', label: 'Columns' },
				{
					key: 'filters',
					label: 'Filters',
					listItems: [
						{ key: 'column', label: 'Column' },
						{ key: 'condition', label: 'Condition' },
						{ key: 'value', label: 'Value' },
					],
				},
				{
					key: 'tableOrder',
					label: 'Table Order',
					listItems: [
						{ key: 'column', label: 'Column' },
						{ key: 'direction', label: 'Direction' },
					],
				},
				{ key: 'graphs', label: 'Graphs' },
				{ key: 'groupBy', label: 'Group By' },
				{ key: 'settings', label: 'Settings' },
				{ key: 'aggregators', label: 'Aggregators' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
			],
		},
		{ key: 'dateFrom', label: 'Date From', format: 'datetime' },
		{ key: 'dateTo', label: 'Date To', format: 'datetime' },
	],
};

export const mauticGetStatsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total' },
		{ key: 'stats', label: 'Stats' },
		{ key: 'availableTables', label: 'Available Tables' },
		{
			key: 'tableColumns',
			label: 'Table Columns',
			children: [
				{ key: 'asset_downloads', label: 'Asset Downloads' },
				{ key: 'audit_log', label: 'Audit Log' },
				{ key: 'campaign_lead_event_log', label: 'Campaign Lead Event Log' },
				{ key: 'campaign_leads', label: 'Campaign Leads' },
				{ key: 'channel_url_trackables', label: 'Channel URL Trackables' },
				{ key: 'companies_leads', label: 'Companies Leads' },
				{ key: 'dynamic_content_lead_data', label: 'Dynamic Content Lead Data' },
				{ key: 'dynamic_content_stats', label: 'Dynamic Content Stats' },
				{ key: 'email_stat_replies', label: 'Email Stat Replies' },
				{ key: 'email_stats', label: 'Email Stats' },
				{ key: 'email_stats_devices', label: 'Email Stats Devices' },
				{ key: 'focus_stats', label: 'Focus Stats' },
				{ key: 'form_submissions', label: 'Form Submissions' },
				{ key: 'ip_addresses', label: 'IP Addresses' },
				{ key: 'lead_categories', label: 'Lead Categories' },
				{ key: 'lead_companies_change_log', label: 'Lead Companies Change Log' },
				{ key: 'lead_devices', label: 'Lead Devices' },
				{ key: 'lead_donotcontact', label: 'Lead Donotcontact' },
				{ key: 'lead_event_log', label: 'Lead Event Log' },
				{ key: 'lead_frequencyrules', label: 'Lead Frequencyrules' },
				{ key: 'lead_lists_leads', label: 'Lead Lists Leads' },
				{ key: 'lead_points_change_log', label: 'Lead Points Change Log' },
				{ key: 'lead_stages_change_log', label: 'Lead Stages Change Log' },
				{ key: 'lead_utmtags', label: 'Lead Utmtags' },
				{ key: 'page_hits', label: 'Page Hits' },
				{ key: 'page_redirects', label: 'Page Redirects' },
				{ key: 'point_lead_action_log', label: 'Point Lead Action Log' },
				{ key: 'point_lead_event_log', label: 'Point Lead Event Log' },
				{ key: 'push_notification_stats', label: 'Push Notification Stats' },
				{ key: 'sms_message_stats', label: 'Sms Message Stats' },
				{ key: 'stage_lead_action_log', label: 'Stage Lead Action Log' },
				{ key: 'tweet_stats', label: 'Tweet Stats' },
				{ key: 'video_hits', label: 'Video Hits' },
				{ key: 'webhook_logs', label: 'Webhook Logs' },
			],
		},
	],
};

export const mauticListDashboardWidgetTypesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'number' },
		{ key: 'types', label: 'Types', dynamicKey: true },
	],
};

export const mauticListReportsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'reports', label: 'Reports', labelKey: 'name', listItems: reportsFields },
	],
};

export const mauticUpdateReportOutputSchema: OutputSchema = {
	fields: [{ key: 'report', label: 'Report', children: reportsFields }],
};
