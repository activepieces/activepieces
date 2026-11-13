import { OutputSchema } from '@activepieces/pieces-framework';

export const mauticDeleteFileOutputSchema: OutputSchema = {
	fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const mauticGetThemeOutputSchema: OutputSchema = {
	fields: [
		{ key: 'theme', label: 'Theme' },
		{ key: 'file', label: 'File', format: 'url' },
	],
};

export const mauticListFilesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'files',
			label: 'Files',
			children: [{ key: '2', label: '2' }],
		},
	],
};

export const mauticListThemesOutputSchema: OutputSchema = {
	fields: [{ key: 'themes', label: 'Themes', dynamicKey: true, labelKey: 'name' }],
};

export const mauticUploadFileOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'file',
			label: 'File',
			children: [
				{ key: 'link', label: 'Link', format: 'image' },
				{ key: 'name', label: 'Name' },
			],
		},
	],
};
