import { OutputSchema } from '@activepieces/pieces-framework';

const taskFields: OutputSchema['fields'] = [
	{ key: 'taskType', label: 'Task Type' },
	{ key: 'taskUUID', label: 'Task UUID' },
];

const accountTaskFields: OutputSchema['fields'] = [
	...taskFields,
	{ key: 'operation', label: 'Operation' },
	{ key: 'startDate', label: 'Start Date', format: 'date' },
	{ key: 'endDate', label: 'End Date', format: 'date' },
];

const usageTotals: OutputSchema['fields'] = [
	{ key: 'credits', label: 'Credits', format: 'currency', currency: 'USD' },
	{ key: 'requests', label: 'Requests', format: 'number' },
];

const spendRowFields: OutputSchema['fields'] = [
	{ key: 'date', label: 'Date', format: 'date' },
	{ key: 'spend', label: 'Spend', format: 'currency', currency: 'USD' },
	{ key: 'count', label: 'Requests', format: 'number' },
];

const spendMeta: OutputSchema['fields'][number] = {
	key: 'meta',
	label: 'Totals',
	children: [
		{ key: 'totalRequests', label: 'Total Requests', format: 'number' },
		{ key: 'totalResults', label: 'Total Results', format: 'number' },
		{ key: 'totalSpend', label: 'Total Spend', format: 'currency', currency: 'USD' },
		{ key: 'avgDailySpend', label: 'Average Daily Spend', format: 'currency', currency: 'USD' },
		{ key: 'projectedSpend', label: 'Projected Spend', format: 'currency', currency: 'USD' },
	],
};

const errorMeta: OutputSchema['fields'][number] = {
	key: 'meta',
	label: 'Totals',
	children: [
		{ key: 'totalErrors', label: 'Total Errors', format: 'number' },
		{ key: 'errorRate', label: 'Error Rate', format: 'number' },
	],
};

const errorCounts: OutputSchema['fields'] = [
	{ key: 'clientErrors', label: 'Client Errors (4xx)', format: 'number' },
	{ key: 'serverErrors', label: 'Server Errors (5xx)', format: 'number' },
];

const inferenceTimes: OutputSchema['fields'] = [
	{ key: 'avgInferenceTime', label: 'Average Inference Time', format: 'number' },
	{ key: 'p50InferenceTime', label: 'P50 Inference Time', format: 'number' },
	{ key: 'p90InferenceTime', label: 'P90 Inference Time', format: 'number' },
	{ key: 'p99InferenceTime', label: 'P99 Inference Time', format: 'number' },
];

const modelColumns: OutputSchema['fields'] = [
	{ key: 'model', label: 'Model AIR ID' },
	{ key: 'modelName', label: 'Model Name' },
];

export const runwareGetAccountOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'data',
			label: 'Account',
			listItems: [
				{ key: 'organizationUUID', label: 'Organization UUID' },
				{ key: 'organizationName', label: 'Organization Name' },
				{ key: 'AIRSource', label: 'AIR Source' },
				{ key: 'balance', label: 'Balance', format: 'currency', currency: 'USD' },
				{
					key: 'team',
					label: 'Team',
					labelKey: 'name',
					listItems: [
						{ key: 'name', label: 'Name' },
						{ key: 'email', label: 'Email', format: 'email' },
						{ key: 'roles', label: 'Roles' },
						{ key: 'joinedAt', label: 'Joined At', format: 'datetime' },
					],
				},
				{
					key: 'apiKeys',
					label: 'API Keys',
					labelKey: 'name',
					listItems: [
						{ key: 'name', label: 'Name' },
						{ key: 'description', label: 'Description' },
						{ key: 'createdAt', label: 'Created At', format: 'datetime' },
						{ key: 'enabled', label: 'Enabled', format: 'boolean' },
						{ key: 'requests', label: 'Requests', format: 'number' },
						{ key: 'lastUsedAt', label: 'Last Used At', format: 'datetime' },
					],
				},
				{
					key: 'usage',
					label: 'Usage',
					children: [
						{ key: 'today', label: 'Today', children: usageTotals },
						{ key: 'last7Days', label: 'Last 7 Days', children: usageTotals },
						{ key: 'last30Days', label: 'Last 30 Days', children: usageTotals },
						{ key: 'total', label: 'Lifetime', children: usageTotals },
					],
				},
				...taskFields,
				{ key: 'operation', label: 'Operation' },
			],
		},
	],
};

export const runwareSearchModelsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'data',
			label: 'Search',
			listItems: [
				{ key: 'totalResults', label: 'Total Results', format: 'number' },
				{
					key: 'results',
					label: 'Models',
					labelKey: 'name',
					listItems: [
						{ key: 'air', label: 'AIR ID' },
						{ key: 'name', label: 'Name' },
						{ key: 'nameContent', label: 'Name Content' },
						{ key: 'version', label: 'Version' },
						{ key: 'category', label: 'Category' },
						{ key: 'type', label: 'Type' },
						{ key: 'architecture', label: 'Architecture' },
						{ key: 'capabilities', label: 'Capabilities' },
						{ key: 'tags', label: 'Tags' },
						{ key: 'source', label: 'Source' },
						{ key: 'private', label: 'Private', format: 'boolean' },
						{ key: 'comment', label: 'Comment' },
						{ key: 'heroImage', label: 'Hero Image', format: 'image' },
						{ key: 'nsfwLevel', label: 'NSFW Level', format: 'number' },
						{
							key: 'creator',
							label: 'Creator',
							children: [
								{ key: 'id', label: 'ID' },
								{ key: 'name', label: 'Name' },
								{ key: 'logo', label: 'Logo', format: 'image' },
								{ key: 'description', label: 'Description' },
								{ key: 'headline', label: 'Headline' },
							],
						},
						{ key: 'defaultWidth', label: 'Default Width', format: 'number' },
						{ key: 'defaultHeight', label: 'Default Height', format: 'number' },
						{ key: 'defaultSteps', label: 'Default Steps', format: 'number' },
						{ key: 'defaultFPS', label: 'Default FPS', format: 'number' },
						{ key: 'defaultNumberOfFrames', label: 'Default Number of Frames', format: 'number' },
						{ key: 'defaultDuration', label: 'Default Duration', format: 'number' },
						{ key: 'defaultWeight', label: 'Default Weight', format: 'number' },
						{ key: 'positiveTriggerWords', label: 'Positive Trigger Words' },
						{ key: 'negativeTriggerWords', label: 'Negative Trigger Words' },
						{ key: 'downloadCount', label: 'Downloads', format: 'number' },
						{ key: 'inferenceCount24h', label: 'Inferences (24h)', format: 'number' },
						{ key: 'rating', label: 'Rating', format: 'number' },
						{ key: 'ratingCount', label: 'Rating Count', format: 'number' },
						{ key: 'thumbsUpCount', label: 'Thumbs Up', format: 'number' },
						{ key: 'thumbsDownCount', label: 'Thumbs Down', format: 'number' },
						{ key: 'featured', label: 'Featured', format: 'number' },
						{ key: 'addedUnixTimestamp', label: 'Added At (Unix)', format: 'number' },
						{ key: 'updatedDateUnixTimestamp', label: 'Updated At (Unix)', format: 'number' },
					],
				},
				{
					key: 'facets',
					label: 'Facets',
					children: [
						{
							key: 'capabilities',
							label: 'Capabilities',
							labelKey: 'value',
							listItems: [
								{ key: 'value', label: 'Value' },
								{ key: 'count', label: 'Count', format: 'number' },
							],
						},
						{
							key: 'architecture',
							label: 'Architectures',
							labelKey: 'value',
							listItems: [
								{ key: 'value', label: 'Value' },
								{ key: 'count', label: 'Count', format: 'number' },
							],
						},
					],
				},
				...taskFields,
			],
		},
	],
};

export const runwareGetUsageActivityOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'data',
			label: 'Usage Activity',
			listItems: [
				...accountTaskFields,
				{
					key: 'usage',
					label: 'Usage',
					children: [
						{
							key: 'timeseries',
							label: 'By Date',
							children: [
								{ key: 'data', label: 'Rows', labelKey: 'date', listItems: spendRowFields },
								spendMeta,
							],
						},
						{
							key: 'model',
							label: 'By Model',
							children: [
								{
									key: 'data',
									label: 'Rows',
									labelKey: 'modelName',
									listItems: [...modelColumns, ...spendRowFields],
								},
								spendMeta,
							],
						},
					],
				},
			],
		},
	],
};

export const runwareGetUsageErrorsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'data',
			label: 'Usage Errors',
			listItems: [
				...accountTaskFields,
				{
					key: 'usage',
					label: 'Usage',
					children: [
						{
							key: 'timeseries',
							label: 'By Date',
							children: [
								{
									key: 'data',
									label: 'Rows',
									labelKey: 'date',
									listItems: [{ key: 'date', label: 'Date', format: 'date' }, ...errorCounts],
								},
								errorMeta,
							],
						},
						{
							key: 'model',
							label: 'By Model',
							children: [
								{
									key: 'data',
									label: 'Rows',
									labelKey: 'modelName',
									listItems: [
										{ key: 'date', label: 'Date', format: 'date' },
										...modelColumns,
										...errorCounts,
									],
								},
								errorMeta,
							],
						},
					],
				},
			],
		},
	],
};

export const runwareGetUsagePerformanceOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'data',
			label: 'Usage Performance',
			listItems: [
				...accountTaskFields,
				{
					key: 'usage',
					label: 'Usage',
					children: [
						{
							key: 'model',
							label: 'By Model',
							children: [
								{
									key: 'data',
									label: 'Rows',
									labelKey: 'modelName',
									listItems: [
										{ key: 'date', label: 'Date', format: 'date' },
										...modelColumns,
										...inferenceTimes,
									],
								},
								{
									key: 'meta',
									label: 'Totals',
									children: [
										{ key: 'totalRequests', label: 'Total Requests', format: 'number' },
										{ key: 'totalResults', label: 'Total Results', format: 'number' },
										{
											key: 'totalSpend',
											label: 'Total Spend',
											format: 'currency',
											currency: 'USD',
										},
										...inferenceTimes,
									],
								},
							],
						},
						{
							key: 'timeseries',
							label: 'By Date',
							children: [
								{ key: 'data', label: 'Rows' },
								{ key: 'meta', label: 'Totals' },
							],
						},
					],
				},
			],
		},
	],
};
