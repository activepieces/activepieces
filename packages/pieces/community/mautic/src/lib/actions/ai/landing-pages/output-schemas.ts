import { OutputSchema } from '@activepieces/pieces-framework';

import { categoryFields, pageFields } from '../../../output-schemas';

export const mauticCreatePageOutputSchema: OutputSchema = {
	fields: [{ key: 'page', label: 'Page', children: pageFields }],
};

export const mauticDeletePageOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'page',
			label: 'Page',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID' },
				{ key: 'title', label: 'Title' },
				{ key: 'alias', label: 'Alias' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'language', label: 'Language' },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'hits', label: 'Hits', format: 'number' },
				{ key: 'uniqueHits', label: 'Unique Hits', format: 'number' },
				{ key: 'variantHits', label: 'Variant Hits', format: 'number' },
				{ key: 'revision', label: 'Revision', format: 'number' },
				{ key: 'metaDescription', label: 'Meta Description' },
				{ key: 'redirectType', label: 'Redirect Type' },
				{ key: 'redirectUrl', label: 'Redirect URL', format: 'url' },
				{ key: 'isPreferenceCenter', label: 'Is Preference Center' },
				{ key: 'noIndex', label: 'No Index' },
				{ key: 'variantSettings', label: 'Variant Settings' },
				{ key: 'variantStartDate', label: 'Variant Start Date' },
				{ key: 'variantParent', label: 'Variant Parent' },
				{ key: 'variantChildren', label: 'Variant Children' },
				{ key: 'translationParent', label: 'Translation Parent' },
				{
					key: 'translationChildren',
					label: 'Translation Children',
					labelKey: 'title',
					listItems: [
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'title', label: 'Title' },
						{ key: 'alias', label: 'Alias' },
						{ key: 'category', label: 'Category' },
						{ key: 'language', label: 'Language' },
						{ key: 'publishUp', label: 'Publish Up' },
						{ key: 'publishDown', label: 'Publish Down' },
						{ key: 'hits', label: 'Hits', format: 'number' },
						{ key: 'uniqueHits', label: 'Unique Hits', format: 'number' },
						{ key: 'variantHits', label: 'Variant Hits', format: 'number' },
						{ key: 'revision', label: 'Revision', format: 'number' },
						{ key: 'metaDescription', label: 'Meta Description' },
						{ key: 'redirectType', label: 'Redirect Type' },
						{ key: 'redirectUrl', label: 'Redirect URL' },
						{ key: 'isPreferenceCenter', label: 'Is Preference Center' },
						{ key: 'noIndex', label: 'No Index' },
						{ key: 'variantSettings', label: 'Variant Settings' },
						{ key: 'variantStartDate', label: 'Variant Start Date' },
						{ key: 'variantParent', label: 'Variant Parent' },
						{ key: 'variantChildren', label: 'Variant Children' },
						{ key: 'translationChildren', label: 'Translation Children' },
						{ key: 'template', label: 'Template' },
						{ key: 'customHtml', label: 'Custom HTML' },
					],
				},
				{ key: 'template', label: 'Template' },
				{ key: 'customHtml', label: 'Custom HTML' },
			],
		},
	],
};

export const mauticGetPageOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'page',
			label: 'Page',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'title', label: 'Title' },
				{ key: 'alias', label: 'Alias' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'language', label: 'Language' },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'hits', label: 'Hits', format: 'number' },
				{ key: 'uniqueHits', label: 'Unique Hits', format: 'number' },
				{ key: 'variantHits', label: 'Variant Hits', format: 'number' },
				{ key: 'revision', label: 'Revision', format: 'number' },
				{ key: 'metaDescription', label: 'Meta Description' },
				{ key: 'redirectType', label: 'Redirect Type' },
				{ key: 'redirectUrl', label: 'Redirect URL', format: 'url' },
				{ key: 'isPreferenceCenter', label: 'Is Preference Center' },
				{ key: 'noIndex', label: 'No Index' },
				{ key: 'variantSettings', label: 'Variant Settings' },
				{ key: 'variantStartDate', label: 'Variant Start Date' },
				{ key: 'variantParent', label: 'Variant Parent' },
				{ key: 'variantChildren', label: 'Variant Children' },
				{ key: 'translationParent', label: 'Translation Parent' },
				{ key: 'translationChildren', label: 'Translation Children' },
				{ key: 'template', label: 'Template' },
				{ key: 'customHtml', label: 'Custom HTML' },
			],
		},
	],
};

export const mauticListPagesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'pages', label: 'Pages', labelKey: 'title', listItems: pageFields },
	],
};
