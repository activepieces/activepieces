import { OutputSchema } from '@activepieces/pieces-framework';

import { fieldFields } from '../../../output-schemas';

export const mauticCreateFieldOutputSchema: OutputSchema = {
	fields: [{ key: 'field', label: 'Field', children: fieldFields }],
};

export const mauticDeleteFieldOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'field',
			label: 'Field',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID' },
				{ key: 'label', label: 'Label' },
				{ key: 'alias', label: 'Alias' },
				{ key: 'type', label: 'Type' },
				{ key: 'group', label: 'Group' },
				{ key: 'order', label: 'Order', format: 'number' },
				{ key: 'object', label: 'Object' },
				{ key: 'defaultValue', label: 'Default Value' },
				{ key: 'isRequired', label: 'Is Required', format: 'boolean' },
				{ key: 'isFixed', label: 'Is Fixed', format: 'boolean' },
				{ key: 'isListable', label: 'Is Listable', format: 'boolean' },
				{ key: 'isVisible', label: 'Is Visible', format: 'boolean' },
				{ key: 'isShortVisible', label: 'Is Short Visible', format: 'boolean' },
				{ key: 'isUniqueIdentifier', label: 'Is Unique Identifier', format: 'boolean' },
				{ key: 'isPubliclyUpdatable', label: 'Is Publicly Updatable', format: 'boolean' },
				{
					key: 'properties',
					label: 'Properties',
					children: [
						{
							key: 'list',
							label: 'List',
							labelKey: 'label',
							listItems: [
								{ key: 'label', label: 'Label' },
								{ key: 'value', label: 'Value' },
							],
						},
					],
				},
				{ key: 'isIndex', label: 'Is Index', format: 'boolean' },
				{ key: 'charLengthLimit', label: 'Char Length Limit', format: 'number' },
			],
		},
	],
};

export const mauticGetFieldOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'field',
			label: 'Field',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'label', label: 'Label' },
				{ key: 'alias', label: 'Alias' },
				{ key: 'type', label: 'Type' },
				{ key: 'group', label: 'Group' },
				{ key: 'order', label: 'Order', format: 'number' },
				{ key: 'object', label: 'Object' },
				{ key: 'defaultValue', label: 'Default Value' },
				{ key: 'isRequired', label: 'Is Required', format: 'boolean' },
				{ key: 'isFixed', label: 'Is Fixed', format: 'boolean' },
				{ key: 'isListable', label: 'Is Listable', format: 'boolean' },
				{ key: 'isVisible', label: 'Is Visible', format: 'boolean' },
				{ key: 'isShortVisible', label: 'Is Short Visible', format: 'boolean' },
				{ key: 'isUniqueIdentifier', label: 'Is Unique Identifier', format: 'boolean' },
				{ key: 'isPubliclyUpdatable', label: 'Is Publicly Updatable', format: 'boolean' },
				{
					key: 'properties',
					label: 'Properties',
					children: [
						{
							key: 'list',
							label: 'List',
							labelKey: 'label',
							listItems: [
								{ key: 'label', label: 'Label' },
								{ key: 'value', label: 'Value' },
							],
						},
					],
				},
				{ key: 'isIndex', label: 'Is Index', format: 'boolean' },
				{ key: 'charLengthLimit', label: 'Char Length Limit', format: 'number' },
			],
		},
	],
};

export const mauticListFieldsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'fields', label: 'Fields', labelKey: 'label', listItems: fieldFields },
	],
};
