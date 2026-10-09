import { OutputSchema } from '@activepieces/pieces-framework';

import { categoryFields } from '../../../output-schemas';

export const mauticCreateSmsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'sms',
			label: 'Sms',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'message', label: 'Message' },
				{ key: 'language', label: 'Language' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'publishUp', label: 'Publish Up', format: 'datetime' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'sentCount', label: 'Sent Count', format: 'number' },
			],
		},
	],
};

export const mauticDeleteSmsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'sms',
			label: 'Sms',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'message', label: 'Message' },
				{ key: 'language', label: 'Language' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'publishUp', label: 'Publish Up', format: 'datetime' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'sentCount', label: 'Sent Count', format: 'number' },
			],
		},
	],
};

export const mauticGetSmsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'sms',
			label: 'Sms',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'message', label: 'Message' },
				{ key: 'language', label: 'Language' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'publishUp', label: 'Publish Up', format: 'datetime' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'sentCount', label: 'Sent Count', format: 'number' },
			],
		},
	],
};

export const mauticListSmsesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{
			key: 'smses',
			label: 'Smses',
			labelKey: 'name',
			listItems: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'message', label: 'Message' },
				{ key: 'language', label: 'Language' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'sentCount', label: 'Sent Count', format: 'number' },
			],
		},
	],
};
