import { OutputSchema } from '@activepieces/pieces-framework';

import { categoryFields, stageFields } from '../../../output-schemas';

export const mauticAdjustContactPointsOutputSchema: OutputSchema = {
	fields: [{ key: 'success', label: 'Success', format: 'number' }],
};

export const mauticCreateStageOutputSchema: OutputSchema = {
	fields: [{ key: 'stage', label: 'Stage', children: stageFields }],
};

export const mauticDeleteStageOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'stage',
			label: 'Stage',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'weight', label: 'Weight', format: 'number' },
				{ key: 'description', label: 'Description' },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
			],
		},
	],
};

export const mauticGetStageOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'stage',
			label: 'Stage',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'weight', label: 'Weight', format: 'number' },
				{ key: 'description', label: 'Description' },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
			],
		},
	],
};

export const mauticListStagesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'stages', label: 'Stages', labelKey: 'name', listItems: stageFields },
	],
};
