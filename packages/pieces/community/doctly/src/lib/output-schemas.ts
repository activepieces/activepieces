import { OutputSchema } from '@activepieces/pieces-framework';

const extractorFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Extractor ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'slug', label: 'Slug' },
	{ key: 'description', label: 'Description' },
	{ key: 'cost_type', label: 'Cost Type' },
	{ key: 'cost_credits', label: 'Cost (Credits)', format: 'number' },
	{ key: 'edit_policy', label: 'Edit Policy' },
	{ key: 'is_locked', label: 'Locked', format: 'boolean' },
	{ key: 'is_deletable_by_user', label: 'Deletable', format: 'boolean' },
	{ key: 'is_referenced', label: 'Referenced', format: 'boolean' },
	{ key: 'builder_session_id', label: 'Builder Session ID' },
	{ key: 'preview_renderer', label: 'Preview Renderer' },
];

const documentFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Document ID' },
	{ key: 'file_name', label: 'File Name' },
	{ key: 'file_size', label: 'File Size', format: 'filesize' },
	{ key: 'page_count', label: 'Page Count', format: 'number' },
	{ key: 'status', label: 'Status' },
	{ key: 'accuracy', label: 'Accuracy' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
];

const progressFields: OutputSchema['fields'] = [
	{ key: 'percent', label: 'Percent', format: 'number' },
	{ key: 'phase', label: 'Phase' },
	{ key: 'message', label: 'Message' },
	{ key: 'completed_units', label: 'Completed Units', format: 'number' },
	{ key: 'total_units', label: 'Total Units', format: 'number' },
	{ key: 'unit', label: 'Unit' },
	{ key: 'stage', label: 'Stage' },
	{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const documentDetailFields: OutputSchema['fields'] = [
	...documentFields,
	{ key: 'extractor_id', label: 'Extractor ID' },
	{ key: 'extractor', label: 'Extractor', children: extractorFields },
	{ key: 'user_id', label: 'Uploader ID' },
	{ key: 'user', label: 'Uploader' },
	{ key: 'feedback_type', label: 'Feedback Type' },
	{ key: 'feedback_text', label: 'Feedback Text' },
	{ key: 'progress', label: 'Progress', children: progressFields },
	{ key: 'output_file_name', label: 'Output File Name' },
	{ key: 'output_file_url', label: 'Output File URL', format: 'url' },
	{ key: 'download_url', label: 'Download URL', format: 'url' },
	{ key: 'file_url', label: 'Uploaded File URL', format: 'url' },
];

const messageFields: OutputSchema['fields'] = [{ key: 'message', label: 'Message' }];

export const convertPdfToTextOutputSchema: OutputSchema = {
	fields: [
		{ key: 'markdownText', label: 'Markdown Text' },
		...documentDetailFields.map((field) => (field.key === 'extractor' ? { key: 'extractor', label: 'Extractor' } : field)),
	],
};

export const doctlyConvertDocumentOutputSchema: OutputSchema = {
	fields: documentFields,
};

export const doctlyGetDocumentOutputSchema: OutputSchema = {
	fields: [
		...documentDetailFields,
		{
			key: 'output',
			label: 'Output',
			description: 'Once status is COMPLETED: the markdown text for a conversion, or the extracted data object for an extractor run. Null before then.',
		},
	],
};

export const doctlyListDocumentsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'data',
			label: 'Documents',
			labelKey: 'file_name',
			listItems: [
				...documentFields,
				{ key: 'extractor_id', label: 'Extractor ID' },
				{ key: 'extractor', label: 'Extractor' },
				{ key: 'user_id', label: 'Uploader ID' },
				{ key: 'user', label: 'Uploader' },
				{ key: 'feedback_type', label: 'Feedback Type' },
				{ key: 'feedback_text', label: 'Feedback Text' },
				{ key: 'progress', label: 'Progress', children: progressFields },
			],
		},
		{ key: 'count', label: 'Total Count', format: 'number' },
	],
};

export const doctlyDeleteDocumentOutputSchema: OutputSchema = {
	fields: messageFields,
};

export const doctlyGetExtractorOutputSchema: OutputSchema = {
	fields: extractorFields,
};

export const doctlyListExtractorsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'data', label: 'Extractors', labelKey: 'name', listItems: extractorFields },
		{ key: 'count', label: 'Total Count', format: 'number' },
	],
};

export const doctlyRunExtractorOutputSchema: OutputSchema = {
	fields: [
		...documentFields.filter((field) => field.key !== 'accuracy'),
		{ key: 'extractor_id', label: 'Extractor ID' },
		{ key: 'extractor', label: 'Extractor', children: extractorFields },
	],
};

export const doctlyGetExtractorUpgradeInfoOutputSchema: OutputSchema = {
	fields: [
		{ key: 'can_upgrade', label: 'Can Upgrade', format: 'boolean' },
		{ key: 'latest_version', label: 'Latest Version' },
		{ key: 'current_source_catalog_version', label: 'Current Catalog Version' },
	],
};

export const doctlyUpgradeExtractorOutputSchema: OutputSchema = {
	fields: extractorFields,
};

export const doctlyGetUsageOutputSchema: OutputSchema = {
	fields: [
		{ key: 'current_balance', label: 'Current Balance (Credits)', format: 'number' },
		{ key: 'start_month', label: 'Start Month' },
		{ key: 'end_month', label: 'End Month' },
		{ key: 'auto_topup_enabled', label: 'Auto Top-Up Enabled', format: 'boolean' },
		{ key: 'auto_topup_threshold_credits', label: 'Auto Top-Up Threshold (Credits)', format: 'number' },
		{
			key: 'monthly',
			label: 'Monthly Usage',
			labelKey: 'month',
			listItems: [
				{ key: 'month', label: 'Month' },
				{ key: 'credits_used', label: 'Credits Used', format: 'number' },
				{ key: 'pages_processed', label: 'Pages Processed', format: 'number' },
				{ key: 'documents_processed', label: 'Documents Processed', format: 'number' },
			],
		},
		{
			key: 'totals',
			label: 'Totals',
			children: [
				{ key: 'credits_used', label: 'Credits Used', format: 'number' },
				{ key: 'pages_processed', label: 'Pages Processed', format: 'number' },
				{ key: 'documents_processed', label: 'Documents Processed', format: 'number' },
			],
		},
		{
			key: 'burn',
			label: 'Burn Rate',
			children: [
				{ key: 'daily_avg_credits_30d', label: 'Daily Average Credits (30 Days)', format: 'number' },
				{ key: 'days_remaining', label: 'Days Remaining', format: 'number' },
			],
		},
	],
};
