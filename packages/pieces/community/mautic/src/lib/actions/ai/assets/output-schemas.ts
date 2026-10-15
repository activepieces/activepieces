import { OutputSchema } from '@activepieces/pieces-framework';

import { assetFields, categoryFields } from '../../../output-schemas';

export const mauticCreateAssetOutputSchema: OutputSchema = {
	fields: [{ key: 'asset', label: 'Asset', children: assetFields }],
};

export const mauticDeleteAssetOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'asset',
			label: 'Asset',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified' },
				{ key: 'id', label: 'ID' },
				{ key: 'title', label: 'Title' },
				{ key: 'alias', label: 'Alias' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'description', label: 'Description' },
				{ key: 'language', label: 'Language' },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'downloadCount', label: 'Download Count', format: 'number' },
				{ key: 'uniqueDownloadCount', label: 'Unique Download Count', format: 'number' },
				{ key: 'revision', label: 'Revision', format: 'number' },
				{ key: 'extension', label: 'Extension' },
				{ key: 'mime', label: 'Mime' },
				{ key: 'size', label: 'Size', format: 'filesize' },
				{ key: 'downloadUrl', label: 'Download URL', format: 'url' },
				{ key: 'storageLocation', label: 'Storage Location' },
				{ key: 'disallow', label: 'Disallow', format: 'boolean' },
			],
		},
	],
};

export const mauticGetAssetOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'asset',
			label: 'Asset',
			children: [
				{ key: 'isPublished', label: 'Published', format: 'boolean' },
				{ key: 'dateAdded', label: 'Date Added', format: 'datetime' },
				{ key: 'dateModified', label: 'Date Modified', format: 'datetime' },
				{ key: 'id', label: 'ID', format: 'number' },
				{ key: 'title', label: 'Title' },
				{ key: 'alias', label: 'Alias' },
				{ key: 'category', label: 'Category', children: categoryFields },
				{ key: 'description', label: 'Description' },
				{ key: 'language', label: 'Language' },
				{ key: 'publishUp', label: 'Publish Up' },
				{ key: 'publishDown', label: 'Publish Down' },
				{ key: 'downloadCount', label: 'Download Count', format: 'number' },
				{ key: 'uniqueDownloadCount', label: 'Unique Download Count', format: 'number' },
				{ key: 'revision', label: 'Revision', format: 'number' },
				{ key: 'extension', label: 'Extension' },
				{ key: 'mime', label: 'Mime' },
				{ key: 'size', label: 'Size', format: 'filesize' },
				{ key: 'downloadUrl', label: 'Download URL', format: 'url' },
				{ key: 'storageLocation', label: 'Storage Location' },
				{ key: 'disallow', label: 'Disallow', format: 'boolean' },
			],
		},
	],
};

export const mauticListAssetsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'assets', label: 'Assets', labelKey: 'title', listItems: assetFields },
	],
};
