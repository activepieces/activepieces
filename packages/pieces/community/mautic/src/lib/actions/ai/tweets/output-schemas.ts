import { OutputSchema } from '@activepieces/pieces-framework';

import { categoryFields, tweetFields } from '../../../output-schemas';

export const mauticCreateTweetOutputSchema: OutputSchema = {
	fields: [{ key: 'tweet', label: 'Tweet', children: tweetFields }],
};

export const mauticDeleteTweetOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'tweet',
			label: 'Tweet',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'text', label: 'Text' },
				{ key: 'language', label: 'Language' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'mediaId', label: 'Media ID' },
				{ key: 'mediaPath', label: 'Media Path' },
				{ key: 'sentCount', label: 'Sent Count', format: 'number' },
				{ key: 'favoriteCount', label: 'Favorite Count', format: 'number' },
				{ key: 'retweetCount', label: 'Retweet Count', format: 'number' },
				{ key: 'description', label: 'Description' },
			],
		},
	],
};

export const mauticGetTweetOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'tweet',
			label: 'Tweet',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'text', label: 'Text' },
				{ key: 'language', label: 'Language' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'mediaId', label: 'Media ID' },
				{ key: 'mediaPath', label: 'Media Path' },
				{ key: 'sentCount', label: 'Sent Count', format: 'number' },
				{ key: 'favoriteCount', label: 'Favorite Count', format: 'number' },
				{ key: 'retweetCount', label: 'Retweet Count', format: 'number' },
				{ key: 'description', label: 'Description' },
			],
		},
	],
};

export const mauticListTweetsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'tweets', label: 'Tweets', labelKey: 'name', listItems: tweetFields },
	],
};
