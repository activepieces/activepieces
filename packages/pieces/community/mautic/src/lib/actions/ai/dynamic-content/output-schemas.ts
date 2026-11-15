import { OutputSchema } from '@activepieces/pieces-framework';

import {
	categoryFields,
	dynamicContentFiltersFields,
	dynamicContentUtmTags2Fields,
	dynamicContentUtmTagsFields,
} from '../../../output-schemas';

export const mauticCreateDynamicContentOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'dynamicContent',
			label: 'Dynamic Content',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'sentCount', label: 'Sent Count', format: 'number' },
				{ key: 'variantParent', label: 'Variant Parent' },
				{ key: 'variantChildren', label: 'Variant Children' },
				{ key: 'content', label: 'Content' },
				{ key: 'utmTags', label: 'Utm Tags', children: dynamicContentUtmTagsFields },
				{ key: 'filters', label: 'Filters', listItems: dynamicContentFiltersFields },
				{ key: 'isCampaignBased', label: 'Is Campaign Based', format: 'boolean' },
				{ key: 'slotName', label: 'Slot Name' },
			],
		},
	],
};

export const mauticDeleteDynamicContentOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'dynamicContent',
			label: 'Dynamic Content',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'sentCount', label: 'Sent Count', format: 'number' },
				{ key: 'variantParent', label: 'Variant Parent' },
				{
					key: 'variantChildren',
					label: 'Variant Children',
					labelKey: 'name',
					listItems: [
						{ key: 'id', label: 'ID', format: 'number' },
						{ key: 'name', label: 'Name' },
						{ key: 'category', label: 'Category' },
						{ key: 'publishUp', label: 'Publish Up' },
						{ key: 'publishDown', label: 'Publish Down' },
						{ key: 'sentCount', label: 'Sent Count', format: 'number' },
						{ key: 'variantChildren', label: 'Variant Children' },
						{ key: 'content', label: 'Content' },
						{ key: 'utmTags', label: 'Utm Tags', children: dynamicContentUtmTags2Fields },
						{ key: 'filters', label: 'Filters' },
						{ key: 'isCampaignBased', label: 'Is Campaign Based', format: 'boolean' },
						{ key: 'slotName', label: 'Slot Name' },
					],
				},
				{ key: 'content', label: 'Content' },
				{ key: 'utmTags', label: 'Utm Tags', children: dynamicContentUtmTags2Fields },
				{ key: 'filters', label: 'Filters', listItems: dynamicContentFiltersFields },
				{ key: 'isCampaignBased', label: 'Is Campaign Based', format: 'boolean' },
				{ key: 'slotName', label: 'Slot Name' },
			],
		},
	],
};

export const mauticGetDynamicContentOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'dynamicContent',
			label: 'Dynamic Content',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'sentCount', label: 'Sent Count', format: 'number' },
				{ key: 'variantParent', label: 'Variant Parent' },
				{ key: 'variantChildren', label: 'Variant Children' },
				{ key: 'content', label: 'Content' },
				{ key: 'utmTags', label: 'Utm Tags', children: dynamicContentUtmTags2Fields },
				{ key: 'filters', label: 'Filters', listItems: dynamicContentFiltersFields },
				{ key: 'isCampaignBased', label: 'Is Campaign Based', format: 'boolean' },
				{ key: 'slotName', label: 'Slot Name' },
			],
		},
	],
};

export const mauticListDynamicContentsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{
			key: 'dynamicContents',
			label: 'Dynamic Contents',
			labelKey: 'name',
			listItems: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'name', label: 'Name' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'sentCount', label: 'Sent Count', format: 'number' },
				{ key: 'variantParent', label: 'Variant Parent' },
				{ key: 'variantChildren', label: 'Variant Children' },
				{ key: 'content', label: 'Content' },
				{ key: 'utmTags', label: 'Utm Tags', children: dynamicContentUtmTags2Fields },
				{ key: 'filters', label: 'Filters', listItems: dynamicContentFiltersFields },
				{ key: 'isCampaignBased', label: 'Is Campaign Based', format: 'boolean' },
				{ key: 'slotName', label: 'Slot Name' },
			],
		},
	],
};
