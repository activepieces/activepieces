import { OutputSchema } from '@activepieces/pieces-framework';

import { categoryFields, pointFields } from '../../../output-schemas';

export const mauticCreatePointActionOutputSchema: OutputSchema = {
	fields: [{ key: 'point', label: 'Point', children: pointFields }],
};

export const mauticDeletePointActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'point',
			label: 'Point',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'type', label: 'Type' },
				{ key: 'description', label: 'Description' },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'delta', label: 'Delta', format: 'number' },
				{ key: 'properties', label: 'Properties' },
				{ key: 'repeatable', label: 'Repeatable', format: 'boolean' },
			],
		},
	],
};

export const mauticGetPointActionOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'point',
			label: 'Point',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'type', label: 'Type' },
				{ key: 'description', label: 'Description' },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'delta', label: 'Delta', format: 'number' },
				{
					key: 'properties',
					label: 'Properties',
					children: [{ key: 'page_url', label: 'Page URL', format: 'url' }],
				},
				{ key: 'repeatable', label: 'Repeatable', format: 'boolean' },
			],
		},
	],
};

export const mauticListPointActionTypesOutputSchema: OutputSchema = {
	fields: [{ key: 'pointActionTypes', label: 'Point Action Types', dynamicKey: true }],
};

export const mauticListPointActionsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'points', label: 'Points', labelKey: 'name', listItems: pointFields },
	],
};
