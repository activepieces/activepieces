import { OutputSchema } from '@activepieces/pieces-framework';

import { pointGroupFields } from '../../../output-schemas';

export const mauticCreatePointGroupOutputSchema: OutputSchema = {
	fields: [{ key: 'pointGroup', label: 'Point Group', children: pointGroupFields }],
};

export const mauticDeletePointGroupOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'pointGroup',
			label: 'Point Group',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'description', label: 'Description' },
			],
		},
	],
};

export const mauticGetPointGroupOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'pointGroup',
			label: 'Point Group',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'description', label: 'Description' },
			],
		},
	],
};

export const mauticListPointGroupsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'pointGroups', label: 'Point Groups', labelKey: 'name', listItems: pointGroupFields },
	],
};
