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
				'Site-specific fields. The children below are those of a YouTube video; other sites return their own fields.',
			children: [
				{ key: 'video_id', label: 'Video ID' },
				{ key: 'title', label: 'Title' },
				{ key: 'link', label: 'Link', format: 'url' },
				{ key: 'description', label: 'Description' },
				{ key: 'views', label: 'Views', format: 'number' },
				{ key: 'likes', label: 'Likes', format: 'number' },
				{ key: 'comment_count', label: 'Comment Count', format: 'number' },
				{ key: 'length_seconds', label: 'Length (Seconds)', format: 'number' },
				{ key: 'published_date', label: 'Published Date', format: 'date' },
				{ key: 'published_at', label: 'Published At', format: 'datetime' },
				{ key: 'category', label: 'Category' },
				{ key: 'keywords', label: 'Keywords' },
				{ key: 'hashtags', label: 'Hashtags' },
				{ key: 'thumbnail', label: 'Thumbnail', format: 'image' },
				{ key: 'is_live', label: 'Is Live', format: 'boolean' },
				{ key: 'is_upcoming', label: 'Is Upcoming', format: 'boolean' },
				{ key: 'was_live', label: 'Was Live', format: 'boolean' },
				{ key: 'is_unlisted', label: 'Is Unlisted', format: 'boolean' },
				{ key: 'is_age_restricted', label: 'Is Age Restricted', format: 'boolean' },
				{ key: 'is_family_safe', label: 'Is Family Safe', format: 'boolean' },
				{
					key: 'channel',
					label: 'Channel',
					children: [
						{ key: 'id', label: 'Channel ID' },
						{ key: 'name', label: 'Name' },
						{ key: 'handle', label: 'Handle' },
						{ key: 'link', label: 'Link', format: 'url' },
						{ key: 'subscribers', label: 'Subscribers', format: 'number' },
						{ key: 'thumbnail', label: 'Thumbnail', format: 'image' },
						{ key: 'verified', label: 'Verified', format: 'boolean' },
					],
				},
				{ key: 'chapters', label: 'Chapters' },
				{
					key: 'description_links',
					label: 'Description Links',
					labelKey: 'text',
					listItems: [
						{ key: 'text', label: 'Text' },
						{ key: 'url', label: 'URL', format: 'url' },
					],
				},
				{
					key: 'available_transcript_languages',
					label: 'Available Transcript Languages',
					labelKey: 'name',
					listItems: [
						{ key: 'name', label: 'Name' },
						{ key: 'lang', label: 'Language Code' },
					],
				},
				{
					key: 'related_videos',
					label: 'Related Videos',
					labelKey: 'title',
					listItems: [
						{ key: 'position', label: 'Position', format: 'number' },
						{ key: 'video_id', label: 'Video ID' },
						{ key: 'title', label: 'Title' },
						{ key: 'link', label: 'Link', format: 'url' },
						{ key: 'length_seconds', label: 'Length (Seconds)', format: 'number' },
						{ key: 'published_time', label: 'Published' },
						{ key: 'views', label: 'Views', format: 'number' },
						{ key: 'thumbnail', label: 'Thumbnail', format: 'image' },
						{
							key: 'channel',
							label: 'Channel',
							children: [
								{ key: 'name', label: 'Name' },
								{ key: 'link', label: 'Link', format: 'url' },
							],
						},
					],
				},
				{
					key: 'transcript',
					label: 'Transcript',
					children: [
						{ key: 'language', label: 'Language' },
						{ key: 'is_generated', label: 'Is Generated', format: 'boolean' },
						{ key: 'text', label: 'Text' },
						{
							key: 'transcripts',
							label: 'Segments',
							labelKey: 'text',
							listItems: [
								{ key: 'text', label: 'Text' },
								{ key: 'start', label: 'Start (Seconds)', format: 'number' },
								{ key: 'duration', label: 'Duration (Seconds)', format: 'number' },
							],
						},
					],
				},
			],
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
