import { OutputSchema } from '@activepieces/pieces-framework';

const generationFields: OutputSchema['fields'] = [
	{ key: 'created', label: 'Created At', format: 'datetime' },
	{ key: 'latency', label: 'Latency (ms)', format: 'number' },
	{ key: 'cost', label: 'Cost', format: 'currency', currency: 'USD' },
];

const modelFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Model ID' },
	{
		key: 'architecture',
		label: 'Architecture',
		children: [
			{ key: 'input_modalities', label: 'Input Modalities' },
			{ key: 'output_modalities', label: 'Output Modalities' },
		],
	},
	{ key: 'created', label: 'Release Date (Unix seconds)', format: 'number' },
	{ key: 'supported_parameters', label: 'Supported Parameters' },
	{
		key: 'parameters',
		label: 'Allowed Values',
		children: [
			{ key: 'size', label: 'Sizes' },
			{ key: 'seconds', label: 'Durations (seconds)' },
		],
	},
	{ key: 'context_length', label: 'Context Length (tokens)', format: 'number' },
	{
		key: 'pricing',
		label: 'Pricing',
		description:
			'Image and video models have min/average/max per generation in USD; text models have per-token prices.',
		children: [
			{ key: 'min', label: 'Min Price per Generation', format: 'currency', currency: 'USD' },
			{
				key: 'average',
				label: 'Average Price per Generation',
				format: 'currency',
				currency: 'USD',
			},
			{ key: 'max', label: 'Max Price per Generation', format: 'currency', currency: 'USD' },
			{ key: 'prompt', label: 'Price per Input Token' },
			{ key: 'completion', label: 'Price per Output Token' },
			{ key: 'image', label: 'Price per Input Image' },
			{ key: 'request', label: 'Price per Request' },
			{ key: 'input_cache_read', label: 'Price per Cached Input Token' },
			{ key: 'input_cache_write', label: 'Price per Cache Write Token' },
			{ key: 'input_cache_write_1h', label: 'Price per 1h Cache Write Token' },
			{ key: 'web_search', label: 'Price per Web Search' },
			{ key: 'internal_reasoning', label: 'Price per Reasoning Token' },
		],
	},
];

const usageFields: OutputSchema['fields'] = [
	{ key: 'total_tokens', label: 'Total Tokens', format: 'number' },
	{ key: 'cost', label: 'Upstream Cost', format: 'currency', currency: 'USD' },
];

export const imageRouterGetCreditsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'remaining_credits', label: 'Remaining Credits', format: 'currency', currency: 'USD' },
		{ key: 'credit_usage', label: 'Credit Usage', format: 'currency', currency: 'USD' },
		{ key: 'total_deposits', label: 'Total Deposits', format: 'currency', currency: 'USD' },
		{
			key: 'usage_by_api_key',
			label: 'Usage by API Key',
			labelKey: 'api_key_name',
			listItems: [
				{ key: 'api_key_id', label: 'API Key ID' },
				{ key: 'api_key_name', label: 'API Key Name' },
				{ key: 'credit_usage', label: 'Credit Usage', format: 'currency', currency: 'USD' },
				{ key: 'total_requests', label: 'Total Requests', format: 'number' },
				{ key: 'created_at', label: 'Created At', format: 'datetime' },
				{ key: 'is_active', label: 'Active', format: 'boolean' },
				{ key: 'spend_limit', label: 'Spend Limit', format: 'currency', currency: 'USD' },
				{ key: 'spend_limit_period', label: 'Spend Limit Period' },
				{ key: 'period_spend', label: 'Spend This Period', format: 'currency', currency: 'USD' },
				{ key: 'period_start', label: 'Period Start', format: 'datetime' },
				{ key: 'expires_at', label: 'Expires At', format: 'datetime' },
			],
		},
	],
};

export const imageRouterImageOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'data',
			label: 'Images',
			labelKey: 'url',
			listItems: [
				{ key: 'url', label: 'Image URL', format: 'image' },
				{ key: 'revised_prompt', label: 'Revised Prompt' },
			],
		},
		...generationFields,
	],
};

export const imageRouterGenerateVideoOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'data',
			label: 'Videos',
			labelKey: 'url',
			listItems: [{ key: 'url', label: 'Video URL', format: 'url' }],
		},
		...generationFields,
	],
};

export const createImageOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'images',
			label: 'Saved Images',
			labelKey: 'fileName',
			listItems: [
				{ key: 'index', label: 'Index', format: 'number' },
				{ key: 'savedFile', label: 'Saved File', format: 'url' },
				{ key: 'fileName', label: 'File Name' },
				{ key: 'url', label: 'Image URL', format: 'image' },
				{ key: 'b64_json', label: 'Base64 Image' },
				{ key: 'revised_prompt', label: 'Revised Prompt' },
			],
		},
		{
			key: 'data',
			label: 'Raw Images',
			listItems: [
				{ key: 'url', label: 'Image URL', format: 'image' },
				{ key: 'b64_json', label: 'Base64 Image' },
				{ key: 'revised_prompt', label: 'Revised Prompt' },
			],
		},
		...generationFields,
	],
};

export const imageRouterGetModelOutputSchema: OutputSchema = {
	fields: [...modelFields, { key: 'aliases', label: 'Aliases' }],
};

export const imageRouterListModelsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'models',
			label: 'Models',
			labelKey: 'id',
			listItems: [...modelFields, { key: 'provider', label: 'Provider' }],
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const imageRouterChatCompletionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Completion ID' },
		{ key: 'model', label: 'Model' },
		{ key: 'created', label: 'Created At (Unix seconds)', format: 'number' },
		{
			key: 'choices',
			label: 'Choices',
			labelKey: 'index',
			listItems: [
				{ key: 'index', label: 'Index', format: 'number' },
				{
					key: 'message',
					label: 'Message',
					children: [
						{ key: 'role', label: 'Role' },
						{ key: 'content', label: 'Reply' },
						{ key: 'tool_calls', label: 'Tool Calls' },
					],
				},
				{ key: 'finish_reason', label: 'Finish Reason' },
			],
		},
		{
			key: 'usage',
			label: 'Usage',
			children: [
				{ key: 'prompt_tokens', label: 'Input Tokens', format: 'number' },
				{ key: 'completion_tokens', label: 'Output Tokens', format: 'number' },
				...usageFields,
			],
		},
		{ key: 'cost', label: 'Credits Charged', format: 'currency', currency: 'USD' },
	],
};

export const imageRouterResponseOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Response ID' },
		{ key: 'model', label: 'Model' },
		{ key: 'status', label: 'Status' },
		{ key: 'created_at', label: 'Created At (Unix seconds)', format: 'number' },
		{
			key: 'output',
			label: 'Output',
			labelKey: 'type',
			listItems: [
				{ key: 'type', label: 'Type' },
				{ key: 'role', label: 'Role' },
				{
					key: 'content',
					label: 'Content',
					labelKey: 'type',
					listItems: [
						{ key: 'type', label: 'Type' },
						{ key: 'text', label: 'Text' },
					],
				},
			],
		},
		{
			key: 'usage',
			label: 'Usage',
			children: [
				{ key: 'input_tokens', label: 'Input Tokens', format: 'number' },
				{ key: 'output_tokens', label: 'Output Tokens', format: 'number' },
				...usageFields,
			],
		},
		{ key: 'cost', label: 'Credits Charged', format: 'currency', currency: 'USD' },
	],
};
