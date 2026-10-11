import { OutputSchema } from '@activepieces/pieces-framework';

const itemFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Item ID', format: 'number' },
	{ key: 'type', label: 'Type' },
	{ key: 'title', label: 'Title' },
	{ key: 'url', label: 'URL', format: 'url' },
	{ key: 'text', label: 'Text', format: 'html' },
	{ key: 'author', label: 'Author' },
	{ key: 'score', label: 'Score', format: 'number' },
	{ key: 'comment_count', label: 'Comment Count', format: 'number' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'time', label: 'Created (Unix Time)', format: 'number' },
	{ key: 'parent_id', label: 'Parent ID', format: 'number' },
	{ key: 'poll_id', label: 'Poll ID', format: 'number' },
	{ key: 'kid_ids', label: 'Comment IDs' },
	{ key: 'part_ids', label: 'Poll Option IDs' },
	{ key: 'dead', label: 'Dead', format: 'boolean' },
	{ key: 'deleted', label: 'Deleted', format: 'boolean' },
	{ key: 'hn_url', label: 'Hacker News URL', format: 'url' },
];

export const hackernewsListStoriesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'stories', label: 'Stories', labelKey: 'title', listItems: itemFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const hackernewsGetItemOutputSchema: OutputSchema = {
	fields: itemFields,
};

export const hackernewsGetUserOutputSchema: OutputSchema = {
	fields: [
		{ key: 'username', label: 'Username' },
		{ key: 'karma', label: 'Karma', format: 'number' },
		{ key: 'about', label: 'About', format: 'html' },
		{ key: 'created_at', label: 'Created At', format: 'datetime' },
		{ key: 'created', label: 'Created (Unix Time)', format: 'number' },
		{ key: 'submitted_count', label: 'Submission Count', format: 'number' },
		{ key: 'recent_submission_ids', label: 'Recent Submission IDs' },
		{ key: 'hn_url', label: 'Hacker News URL', format: 'url' },
	],
};

export const hackernewsGetMaxItemIdOutputSchema: OutputSchema = {
	fields: [{ key: 'max_item_id', label: 'Max Item ID', format: 'number' }],
};

export const hackernewsGetUpdatesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'item_ids', label: 'Changed Item IDs' },
		{ key: 'profiles', label: 'Changed Usernames' },
		{ key: 'item_count', label: 'Changed Item Count', format: 'number' },
		{ key: 'profile_count', label: 'Changed Profile Count', format: 'number' },
	],
};

export const fetchTopStoriesOutputSchema: OutputSchema = {
	itemLabel: '{title}',
	fields: [
		{
			key: 'stories',
			label: 'Stories',
			value: '',
			listItems: [
				{ key: 'id', label: 'Item ID', format: 'number' },
				{ key: 'type', label: 'Type' },
				{ key: 'title', label: 'Title' },
				{ key: 'url', label: 'URL', format: 'url' },
				{ key: 'by', label: 'Author' },
				{ key: 'score', label: 'Score', format: 'number' },
				{ key: 'descendants', label: 'Comment Count', format: 'number' },
				{ key: 'time', label: 'Created (Unix Time)', format: 'number' },
				{ key: 'kids', label: 'Comment IDs' },
			],
		},
	],
};
