import { OutputSchema } from '@activepieces/pieces-framework';

export const mauticCreateTagOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'tag',
			label: 'Tag',
			children: [
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'tag', label: 'Tag' },
				{ key: 'description', label: 'Description' },
			],
		},
	],
};

export const mauticDeleteTagOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'tag',
			label: 'Tag',
			children: [
				{ key: 'id', label: 'ID' },
				{ key: 'tag', label: 'Tag' },
				{ key: 'description', label: 'Description' },
			],
		},
	],
};

export const mauticListTagsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{
			key: 'tags',
			label: 'Tags',
			labelKey: 'id',
			listItems: [
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'tag', label: 'Tag' },
				{ key: 'description', label: 'Description' },
			],
		},
	],
};
