import { OutputSchema } from '@activepieces/pieces-framework';

const accountFields: OutputSchema['fields'] = [
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'remaining_api_calls', label: 'Remaining API Calls', format: 'number' },
	{ key: 'remaining_monthly_credits', label: 'Remaining Monthly Credits', format: 'number' },
	{ key: 'remaining_payg_credits', label: 'Remaining Pay-As-You-Go Credits', format: 'number' },
	{ key: 'remaining_total_credits', label: 'Remaining Total Credits', format: 'number' },
	{
		key: 'resets_at',
		label: 'Quota Resets At',
		format: 'number',
		description: 'Unix timestamp in seconds when the monthly quota resets.',
	},
	{ key: 'remaining_concurrency', label: 'Remaining Concurrency', format: 'number' },
];

const pageTextFields: OutputSchema['fields'] = [
	{ key: 'title', label: 'Title' },
	{ key: 'description', label: 'Description' },
	{ key: 'content', label: 'Content', description: 'Visible page text as Markdown.' },
];

export const accountOutputSchema: OutputSchema = { fields: accountFields };

export const pageHtmlOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'result',
			label: 'Result',
			format: 'html',
			description: 'Page HTML, or the JavaScript Code result when Return Script Result is set.',
		},
		{ key: 'cookies', label: 'Cookies', description: 'Cookies set by the target page.' },
	],
};

export const pageTextOutputSchema: OutputSchema = {
	fields: [
		...pageTextFields,
		{
			key: 'links',
			label: 'Links',
			description: 'Links in the page body, when Return Links is set.',
		},
	],
};

export const selectedMultipleOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'results',
			label: 'Results',
			description: 'Lists of inner HTML of the matched elements.',
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const answerOutputSchema: OutputSchema = {
	fields: [{ key: 'result', label: 'Answer' }],
};

export const extractedFieldsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'result',
			label: 'Extracted Fields',
			dynamicKey: true,
			description: 'One value per requested field name; null when the page lacks it.',
		},
	],
};

export const googleSearchOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'search_parameters',
			label: 'Search Parameters',
			children: [
				{ key: 'engine', label: 'Engine' },
				{ key: 'q', label: 'Query' },
				{ key: 'gl', label: 'Country Code' },
				{ key: 'hl', label: 'Language Code' },
				{ key: 'page', label: 'Page', format: 'number' },
			],
		},
		{
			key: 'search_information',
			label: 'Search Information',
			children: [
				{ key: 'query_displayed', label: 'Query Displayed' },
				{ key: 'organic_results_state', label: 'Organic Results State' },
			],
		},
		{ key: 'organic_results', label: 'Organic Results' },
		{
			key: 'related_searches',
			label: 'Related Searches',
			labelKey: 'query',
			listItems: [{ key: 'query', label: 'Query' }],
		},
		{
			key: 'pagination',
			label: 'Pagination',
			children: [
				{ key: 'current', label: 'Current Page', format: 'number' },
				{ key: 'next', label: 'Next Page', format: 'number' },
			],
		},
	],
};

export const siteDataOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'request_parameters',
			label: 'Request Parameters',
			children: [
				{ key: 'url', label: 'URL', format: 'url' },
				{ key: 'provider', label: 'Provider' },
				{ key: 'type', label: 'Type' },
			],
		},
		{ key: 'parse_status', label: 'Parse Status' },
		{
			key: 'data',
			label: 'Data',
			description:
				'Site-specific fields, e.g. title, views and channel for a YouTube video, or posts and comments for a Reddit thread.',
		},
	],
};

export const humanAccountOutputSchema: OutputSchema = {
	fields: [
		{ key: 'status', label: 'Status', format: 'number' },
		{ key: 'body', label: 'Body', children: accountFields },
	],
};

export const humanResponseOutputSchema: OutputSchema = {
	fields: [
		{ key: 'status', label: 'Status', format: 'number' },
		{
			key: 'body',
			label: 'Body',
			description: 'Response text, or an object with a result key when Response Format is JSON.',
		},
	],
};

export const humanPageTextOutputSchema: OutputSchema = {
	fields: [
		{ key: 'status', label: 'Status', format: 'number' },
		{
			key: 'body',
			label: 'Body',
			description:
				'Page text; an object with title, description and content when Text Format is JSON.',
			children: pageTextFields,
		},
	],
};

export const humanExtractedFieldsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'status', label: 'Status', format: 'number' },
		{
			key: 'body',
			label: 'Body',
			children: [
				{
					key: 'result',
					label: 'Extracted Fields',
					dynamicKey: true,
					description: 'One value per requested field name; null when the page lacks it.',
				},
			],
		},
	],
};
