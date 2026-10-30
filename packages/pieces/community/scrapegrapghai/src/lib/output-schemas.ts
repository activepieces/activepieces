import { OutputSchema } from '@activepieces/pieces-framework';

const okFields: OutputSchema['fields'] = [{ key: 'ok', label: 'Success', format: 'boolean' }];

const usageField: OutputSchema['fields'][number] = {
	key: 'usage',
	label: 'Token Usage',
	children: [
		{ key: 'promptTokens', label: 'Prompt Tokens', format: 'number' },
		{ key: 'completionTokens', label: 'Completion Tokens', format: 'number' },
	],
};

const extractFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Request ID' },
	{ key: 'json', label: 'Extracted Data', dynamicKey: true },
	{ key: 'raw', label: 'Raw Model Output' },
	usageField,
];

const formatDataFields: OutputSchema['fields'] = [{ key: 'data', label: 'Content' }];

const countedFormatFields: OutputSchema['fields'] = [
	{ key: 'data', label: 'URLs' },
	{
		key: 'metadata',
		label: 'Metadata',
		children: [{ key: 'count', label: 'Count', format: 'number' }],
	},
];

const scrapeResultsField: OutputSchema['fields'][number] = {
	key: 'results',
	label: 'Results',
	children: [
		{ key: 'markdown', label: 'Markdown', children: formatDataFields },
		{ key: 'html', label: 'HTML', children: formatDataFields },
		{ key: 'links', label: 'Links', children: countedFormatFields },
		{ key: 'images', label: 'Images', children: countedFormatFields },
		{ key: 'summary', label: 'Summary', children: [{ key: 'data', label: 'Summary' }] },
		{
			key: 'json',
			label: 'JSON',
			children: [{ key: 'data', label: 'Extracted Data', dynamicKey: true }],
		},
		{
			key: 'branding',
			label: 'Branding',
			children: [
				{
					key: 'data',
					label: 'Branding',
					children: [
						{ key: 'colorScheme', label: 'Color Scheme' },
						{
							key: 'colors',
							label: 'Colors',
							children: [
								{ key: 'primary', label: 'Primary' },
								{ key: 'accent', label: 'Accent' },
								{ key: 'background', label: 'Background' },
								{ key: 'textPrimary', label: 'Text Primary' },
								{ key: 'link', label: 'Link' },
							],
						},
						{
							key: 'fonts',
							label: 'Fonts',
							labelKey: 'family',
							listItems: [
								{ key: 'family', label: 'Family' },
								{ key: 'role', label: 'Role' },
							],
						},
						{
							key: 'typography',
							label: 'Typography',
							children: [
								{ key: 'fontFamilies', label: 'Font Families' },
								{ key: 'fontStacks', label: 'Font Stacks' },
								{ key: 'fontSizes', label: 'Font Sizes' },
							],
						},
						{
							key: 'spacing',
							label: 'Spacing',
							children: [
								{ key: 'baseUnit', label: 'Base Unit', format: 'number' },
								{ key: 'borderRadius', label: 'Border Radius' },
							],
						},
						{
							key: 'components',
							label: 'Components',
							children: [
								{ key: 'input', label: 'Input' },
								{ key: 'buttonPrimary', label: 'Primary Button' },
								{ key: 'buttonSecondary', label: 'Secondary Button' },
							],
						},
						{
							key: 'images',
							label: 'Images',
							children: [
								{ key: 'logo', label: 'Logo', format: 'image' },
								{ key: 'favicon', label: 'Favicon', format: 'image' },
								{ key: 'ogImage', label: 'Open Graph Image', format: 'image' },
							],
						},
						{
							key: 'personality',
							label: 'Personality',
							children: [
								{ key: 'tone', label: 'Tone' },
								{ key: 'energy', label: 'Energy' },
								{ key: 'targetAudience', label: 'Target Audience' },
							],
						},
						{
							key: 'designSystem',
							label: 'Design System',
							children: [
								{ key: 'framework', label: 'Framework' },
								{ key: 'componentLibrary', label: 'Component Library' },
							],
						},
						{
							key: 'confidence',
							label: 'Confidence',
							children: [{ key: 'overall', label: 'Overall', format: 'number' }],
						},
					],
				},
				{
					key: 'metadata',
					label: 'Page Metadata',
					children: [
						{
							key: 'branding',
							label: 'Page',
							children: [
								{ key: 'title', label: 'Title' },
								{ key: 'description', label: 'Description' },
								{ key: 'favicon', label: 'Favicon', format: 'image' },
								{ key: 'language', label: 'Language' },
								{ key: 'themeColor', label: 'Theme Color' },
								{ key: 'ogTitle', label: 'Open Graph Title' },
								{ key: 'ogDescription', label: 'Open Graph Description' },
								{ key: 'ogImage', label: 'Open Graph Image', format: 'image' },
								{ key: 'ogUrl', label: 'Open Graph URL', format: 'url' },
							],
						},
					],
				},
			],
		},
		{
			key: 'screenshot',
			label: 'Screenshot',
			children: [
				{
					key: 'data',
					label: 'Screenshot',
					children: [
						{ key: 'url', label: 'Image URL', format: 'image' },
						{ key: 'width', label: 'Width', format: 'number' },
						{ key: 'height', label: 'Height', format: 'number' },
					],
				},
			],
		},
	],
};

const pageMetadataField: OutputSchema['fields'][number] = {
	key: 'metadata',
	label: 'Metadata',
	children: [{ key: 'contentType', label: 'Content Type' }],
};

const crawlPageFields: OutputSchema['fields'] = [
	{ key: 'url', label: 'URL', format: 'url' },
	{ key: 'title', label: 'Title' },
	{ key: 'status', label: 'Status' },
	{ key: 'depth', label: 'Depth', format: 'number' },
	{ key: 'parentUrl', label: 'Parent URL', format: 'url' },
	{ key: 'contentType', label: 'Content Type' },
	{ key: 'links', label: 'Links' },
	{ key: 'scrapeRefId', label: 'Scrape Request ID' },
];

const crawlFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Crawl ID' },
	{ key: 'status', label: 'Status' },
	{ key: 'reason', label: 'Reason' },
	{ key: 'total', label: 'Total Pages', format: 'number' },
	{ key: 'finished', label: 'Finished Pages', format: 'number' },
	{ key: 'pages', label: 'Pages', labelKey: 'url', listItems: crawlPageFields },
];

const monitorFields: OutputSchema['fields'] = [
	{ key: 'cronId', label: 'Monitor ID' },
	{ key: 'scheduleId', label: 'Schedule ID' },
	{ key: 'status', label: 'Status' },
	{ key: 'interval', label: 'Interval' },
	{ key: 'reason', label: 'Reason' },
	{ key: 'consecutiveFailures', label: 'Consecutive Failures', format: 'number' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const historyEntryFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Request ID' },
	{ key: 'service', label: 'Service' },
	{ key: 'status', label: 'Status' },
	{ key: 'params', label: 'Request Params', dynamicKey: true },
	{ key: 'result', label: 'Result', dynamicKey: true },
	{ key: 'error', label: 'Error' },
	{ key: 'elapsedMs', label: 'Elapsed (ms)', format: 'number' },
	{ key: 'requestParentId', label: 'Parent Request ID' },
	{ key: 'sessionId', label: 'Session ID' },
	{ key: 'userId', label: 'User ID' },
	{ key: 'workspaceId', label: 'Workspace ID' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
];

export const scrapegrapghaiOkOutputSchema: OutputSchema = { fields: okFields };

export const scrapegrapghaiCrawlOutputSchema: OutputSchema = { fields: crawlFields };

export const scrapegrapghaiStartCrawlOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Crawl ID' },
		{ key: 'status', label: 'Status' },
		{ key: 'total', label: 'Total Pages', format: 'number' },
		{ key: 'finished', label: 'Finished Pages', format: 'number' },
		{ key: 'pages', label: 'Pages' },
	],
};

export const scrapegrapghaiListCrawlPagesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'data',
			label: 'Pages',
			labelKey: 'url',
			listItems: [
				...crawlPageFields,
				{
					key: 'scrape',
					label: 'Scrape Result',
					children: [
						{ key: 'results', label: 'Results by Format', dynamicKey: true },
						pageMetadataField,
					],
				},
			],
		},
		{
			key: 'pagination',
			label: 'Pagination',
			children: [
				{ key: 'limit', label: 'Limit', format: 'number' },
				{ key: 'nextCursor', label: 'Next Cursor' },
			],
		},
	],
};

export const scrapegrapghaiGetCreditsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'remaining', label: 'Remaining Credits', format: 'number' },
		{ key: 'used', label: 'Used Credits', format: 'number' },
		{ key: 'plan', label: 'Plan' },
		{
			key: 'jobs',
			label: 'Job Slots',
			children: [
				{
					key: 'crawl',
					label: 'Crawl',
					children: [
						{ key: 'used', label: 'Used', format: 'number' },
						{ key: 'limit', label: 'Limit', format: 'number' },
					],
				},
				{
					key: 'monitor',
					label: 'Monitor',
					children: [
						{ key: 'used', label: 'Used', format: 'number' },
						{ key: 'limit', label: 'Limit', format: 'number' },
					],
				},
			],
		},
	],
};

export const scrapegrapghaiExtractOutputSchema: OutputSchema = { fields: extractFields };

export const scrapegrapghaiListHistoryOutputSchema: OutputSchema = {
	fields: [
		{ key: 'data', label: 'Requests', labelKey: 'id', listItems: historyEntryFields },
		{
			key: 'pagination',
			label: 'Pagination',
			children: [
				{ key: 'page', label: 'Page', format: 'number' },
				{ key: 'limit', label: 'Limit', format: 'number' },
				{ key: 'total', label: 'Total', format: 'number' },
			],
		},
	],
};

export const scrapegrapghaiGetHistoryEntryOutputSchema: OutputSchema = {
	fields: historyEntryFields,
};

export const scrapegrapghaiMarkdownifyOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Request ID' },
		{
			key: 'results',
			label: 'Results',
			children: [{ key: 'markdown', label: 'Markdown', children: formatDataFields }],
		},
		pageMetadataField,
	],
};

export const scrapegrapghaiListMonitorActivityOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'ticks',
			label: 'Runs',
			labelKey: 'createdAt',
			listItems: [
				{ key: 'id', label: 'Run ID' },
				{ key: 'status', label: 'Status' },
				{ key: 'changed', label: 'Changed', format: 'boolean' },
				{ key: 'diffs', label: 'Diffs', dynamicKey: true },
				{ key: 'elapsedMs', label: 'Elapsed (ms)', format: 'number' },
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
			],
		},
		{ key: 'nextCursor', label: 'Next Cursor' },
	],
};

export const scrapegrapghaiMonitorOutputSchema: OutputSchema = { fields: monitorFields };

export const scrapegrapghaiListMonitorsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'monitors', label: 'Monitors', labelKey: 'cronId', listItems: monitorFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const scrapegrapghaiScrapePageOutputSchema: OutputSchema = {
	fields: [{ key: 'id', label: 'Request ID' }, scrapeResultsField, pageMetadataField],
};

export const scrapegrapghaiSearchWebOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Request ID' },
		{
			key: 'results',
			label: 'Results',
			labelKey: 'title',
			listItems: [
				{ key: 'url', label: 'URL', format: 'url' },
				{ key: 'title', label: 'Title' },
				{ key: 'content', label: 'Content' },
			],
		},
		{ key: 'json', label: 'Extracted Data', dynamicKey: true },
		{ key: 'raw', label: 'Raw Model Output' },
		usageField,
		{
			key: 'metadata',
			label: 'Metadata',
			children: [
				{
					key: 'pages',
					label: 'Pages',
					children: [
						{ key: 'requested', label: 'Requested', format: 'number' },
						{ key: 'scraped', label: 'Scraped', format: 'number' },
					],
				},
			],
		},
	],
};
