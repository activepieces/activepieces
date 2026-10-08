import { OutputSchema } from '@activepieces/pieces-framework';

const renderResultFields: OutputSchema['fields'] = [
	{ key: 'status', label: 'Status' },
	{ key: 'url', label: 'File URL', format: 'url' },
	{ key: 'fileName', label: 'File Name' },
	{ key: 'self', label: 'Render Link', format: 'url' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
];

const renderFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Render ID' },
	{ key: 'status', label: 'Status' },
	{ key: 'file', label: 'File URL', format: 'url' },
	{ key: 'preview', label: 'Preview', format: 'image' },
	{ key: 'templateId', label: 'Template ID' },
	{ key: 'organizationId', label: 'Organization ID' },
	{ key: 'renderSource', label: 'Render Source' },
	{ key: 'cacheHash', label: 'Cache Hash' },
	{
		key: 'modifications',
		label: 'Modifications',
		labelKey: 'target',
		listItems: [
			{ key: 'target', label: 'Target' },
			{ key: 'value', label: 'Value' },
		],
	},
	{ key: 'formatType', label: 'Format' },
	{ key: 'fileName', label: 'File Name' },
	{ key: 'size', label: 'Size', format: 'filesize' },
	{ key: 'width', label: 'Width', format: 'number' },
	{ key: 'height', label: 'Height', format: 'number' },
	{
		key: 'assetsLoaded',
		label: 'Assets Loaded',
		labelKey: 'name',
		listItems: [
			{ key: 'name', label: 'Name' },
			{ key: 'duration', label: 'Load Time', format: 'duration' },
			{ key: 'state', label: 'State' },
		],
	},
	{ key: 'hits', label: 'Hits', format: 'number' },
	{ key: 'renderCost', label: 'Render Cost (Credits)', format: 'number' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
];

export const robollyUpdateTemplateOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'templateId', label: 'Template ID' },
	],
};

export const robollyCreateTemplateOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Template ID' },
		{ key: 'name', label: 'Name' },
		{ key: 'organizationId', label: 'Organization ID' },
		{ key: 'artboardWidth', label: 'Width', format: 'number' },
		{ key: 'artboardHeight', label: 'Height', format: 'number' },
		{ key: 'backgroundColor', label: 'Background Color' },
		{ key: 'renderFileName', label: 'Render File Name' },
		{ key: 'disallowNotSigned', label: 'Require Signed Render Links', format: 'boolean' },
		{ key: 'nodes', label: 'Elements' },
		{ key: 'modificationsPresets', label: 'Modification Presets' },
		{ key: 'previewState', label: 'Preview State' },
		{ key: 'createdAt', label: 'Created At', format: 'datetime' },
		{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
	],
};

export const robollyListTemplateElementsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'acceptedModifications',
			label: 'Elements',
			labelKey: 'key',
			listItems: [
				{ key: 'key', label: 'Element Name' },
				{ key: 'elementType', label: 'Element Type' },
				{ key: 'type', label: 'Value Type' },
				{ key: 'detailedModificationKeys', label: 'Detailed Modification Keys' },
			],
		},
		{ key: 'scope', label: 'Scope' },
		{
			key: 'baseModificationBehavior',
			label: 'Base Modification Behavior',
			dynamicKey: true,
		},
		{
			key: 'detailedModifications',
			label: 'Detailed Modifications',
			children: [
				{ key: 'syntax', label: 'Syntax' },
				{ key: 'note', label: 'Note' },
				{ key: 'constraintsNote', label: 'Constraints Note' },
				{ key: 'arrayIndexPlaceholder', label: 'Array Index Placeholder' },
				{ key: 'keys', label: 'Property Keys' },
				{
					key: 'properties',
					label: 'Properties',
					dynamicKey: true,
				},
				{
					key: 'examples',
					label: 'Examples',
					labelKey: 'key',
					listItems: [
						{ key: 'key', label: 'Key' },
						{ key: 'value', label: 'Value' },
						{ key: 'description', label: 'Description' },
					],
				},
			],
		},
	],
};

export const robollyListGalleryTemplatesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'templates',
			label: 'Templates',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Template ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'tags', label: 'Tags' },
				{ key: 'artboardWidth', label: 'Width', format: 'number' },
				{ key: 'artboardHeight', label: 'Height', format: 'number' },
				{ key: 'backgroundColor', label: 'Background Color' },
				{ key: 'previewUrl', label: 'Preview', format: 'image' },
				{
					key: 'modificationsPresets',
					label: 'Modification Presets',
					labelKey: 'name',
					listItems: [
						{ key: 'name', label: 'Name' },
						{ key: 'previewUrl', label: 'Preview', format: 'image' },
					],
				},
			],
		},
		{ key: 'hasMore', label: 'Has More', format: 'boolean' },
		{ key: 'paginationCursorNext', label: 'Next Page Cursor' },
	],
};

export const generateImageOutputSchema: OutputSchema = {
	fields: renderResultFields,
};

export const robollyGetRenderOutputSchema: OutputSchema = {
	fields: renderFields,
};

export const robollyCreateHiddenRenderLinkOutputSchema: OutputSchema = {
	fields: [{ key: 'url', label: 'Hidden Render Link', format: 'url' }],
};

export const robollyRenderTemplateOutputSchema: OutputSchema = {
	fields: renderResultFields,
};

export const robollyListRendersOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'value',
			label: 'Renders',
			labelKey: 'id',
			listItems: renderFields,
		},
		{ key: 'hasMore', label: 'Has More', format: 'boolean' },
		{ key: 'paginationCursorNext', label: 'Next Page Cursor' },
		{ key: 'paginationCursorPrevious', label: 'Previous Page Cursor' },
	],
};

export const robollyListTemplatesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'templates',
			label: 'Templates',
			labelKey: 'name',
			listItems: [
				{ key: 'id', label: 'Template ID' },
				{ key: 'name', label: 'Name' },
				{ key: 'path', label: 'Folder Path' },
				{ key: 'artboardWidth', label: 'Width', format: 'number' },
				{ key: 'artboardHeight', label: 'Height', format: 'number' },
				{ key: 'backgroundColor', label: 'Background Color' },
				{ key: 'renderFileName', label: 'Render File Name' },
				{ key: 'disallowNotSigned', label: 'Require Signed Render Links', format: 'boolean' },
				{ key: 'previewUrl', label: 'Preview', format: 'image' },
				{ key: 'previewState', label: 'Preview State' },
				{ key: 'previewUpdatedAt', label: 'Preview Updated At', format: 'datetime' },
				{ key: 'transition', label: 'Transition' },
				{ key: 'createdAt', label: 'Created At', format: 'datetime' },
				{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};
