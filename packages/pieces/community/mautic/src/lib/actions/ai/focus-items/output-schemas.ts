import { OutputSchema } from '@activepieces/pieces-framework';

import {
	categoryFields,
	dynamicContentUtmTagsFields,
	focusPropertiesFields,
} from '../../../output-schemas';

export const mauticCreateFocusItemOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'focus',
			label: 'Focus',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'description', label: 'Description' },
				{ key: 'type', label: 'Type' },
				{ key: 'website', label: 'Website', format: 'url' },
				{ key: 'style', label: 'Style' },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'properties', label: 'Properties', children: focusPropertiesFields },
				{ key: 'utmTags', label: 'Utm Tags', children: dynamicContentUtmTagsFields },
				{ key: 'form', label: 'Form', format: 'number' },
				{ key: 'htmlMode', label: 'HTML Mode' },
				{ key: 'html', label: 'HTML' },
				{ key: 'editor', label: 'Editor' },
				{ key: 'cache', label: 'Cache' },
			],
		},
	],
};

export const mauticDeleteFocusItemOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'focus',
			label: 'Focus',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'description', label: 'Description' },
				{ key: 'type', label: 'Type' },
				{ key: 'website', label: 'Website', format: 'url' },
				{ key: 'style', label: 'Style' },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'properties', label: 'Properties', children: focusPropertiesFields },
				{ key: 'utmTags', label: 'Utm Tags', children: dynamicContentUtmTagsFields },
				{ key: 'form', label: 'Form', format: 'number' },
				{ key: 'htmlMode', label: 'HTML Mode' },
				{ key: 'html', label: 'HTML' },
				{ key: 'editor', label: 'Editor' },
				{ key: 'cache', label: 'Cache' },
			],
		},
	],
};

export const mauticGenerateFocusItemJsOutputSchema: OutputSchema = {
	fields: [{ key: 'js', label: 'Js' }],
};

export const mauticGetFocusItemOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'focus',
			label: 'Focus',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'description', label: 'Description' },
				{ key: 'type', label: 'Type' },
				{ key: 'website', label: 'Website', format: 'url' },
				{ key: 'style', label: 'Style' },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'properties', label: 'Properties', children: focusPropertiesFields },
				{ key: 'utmTags', label: 'Utm Tags', children: dynamicContentUtmTagsFields },
				{ key: 'form', label: 'Form', format: 'number' },
				{ key: 'htmlMode', label: 'HTML Mode' },
				{ key: 'html', label: 'HTML' },
				{ key: 'editor', label: 'Editor' },
				{ key: 'cache', label: 'Cache' },
			],
		},
	],
};

export const mauticListFocusItemsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{
			key: 'focus',
			label: 'Focus',
			labelKey: 'name',
			listItems: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'description', label: 'Description' },
				{ key: 'type', label: 'Type' },
				{ key: 'website', label: 'Website', format: 'url' },
				{ key: 'style', label: 'Style' },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'properties', label: 'Properties', children: focusPropertiesFields },
				{ key: 'utmTags', label: 'Utm Tags', children: dynamicContentUtmTagsFields },
				{ key: 'form', label: 'Form' },
				{ key: 'htmlMode', label: 'HTML Mode' },
				{ key: 'html', label: 'HTML' },
				{ key: 'editor', label: 'Editor' },
				{ key: 'cache', label: 'Cache' },
			],
		},
	],
};
