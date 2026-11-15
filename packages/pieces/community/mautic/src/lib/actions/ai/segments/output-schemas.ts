import { OutputSchema } from '@activepieces/pieces-framework';

import {
	categoryFields,
	listFields,
	listFilters2Fields,
	listFiltersFields,
} from '../../../output-schemas';

export const mauticAddContactsToSegmentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'number' },
		{ key: 'details', label: 'Details', dynamicKey: true },
	],
};

export const mauticAdjustContactPointsOutputSchema: OutputSchema = {
	fields: [{ key: 'success', label: 'Success', format: 'number' }],
};

export const mauticCreateSegmentOutputSchema: OutputSchema = {
	fields: [{ key: 'list', label: 'List', children: listFields }],
};

export const mauticDeleteSegmentOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'list',
			label: 'List',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'publicName', label: 'Public Name' },
				{ key: 'alias', label: 'Alias' },
				{ key: 'description', label: 'Description' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'filters', label: 'Filters', listItems: listFilters2Fields },
				{ key: 'isGlobal', label: 'Is Global', format: 'boolean' },
				{ key: 'isPreferenceCenter', label: 'Is Preference Center', format: 'boolean' },
			],
		},
	],
};

export const mauticGetSegmentOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'list',
			label: 'List',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'publicName', label: 'Public Name' },
				{ key: 'alias', label: 'Alias' },
				{ key: 'description', label: 'Description' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'filters', label: 'Filters', listItems: listFiltersFields },
				{ key: 'isGlobal', label: 'Is Global', format: 'boolean' },
				{ key: 'isPreferenceCenter', label: 'Is Preference Center', format: 'boolean' },
			],
		},
	],
};

export const mauticListSegmentsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'lists', label: 'Lists', labelKey: 'name', listItems: listFields },
	],
};

export const mauticUpdateSegmentOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'list',
			label: 'List',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'publicName', label: 'Public Name' },
				{ key: 'alias', label: 'Alias' },
				{ key: 'description', label: 'Description' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'filters', label: 'Filters', listItems: listFilters2Fields },
				{ key: 'isGlobal', label: 'Is Global', format: 'boolean' },
				{ key: 'isPreferenceCenter', label: 'Is Preference Center', format: 'boolean' },
			],
		},
	],
};
