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
	fields: [
		{
			key: 'themes',
			label: 'Themes',
			children: [
				{
					key: 'Theme1212Column',
					label: 'Theme1212 Column',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
					],
				},
				{
					key: 'Theme121Column',
					label: 'Theme121 Column',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
					],
				},
				{
					key: 'Theme12Column',
					label: 'Theme12 Column',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
					],
				},
				{
					key: 'Theme1313Column',
					label: 'Theme1313 Column',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
					],
				},
				{
					key: 'Theme13Column',
					label: 'Theme13 Column',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
					],
				},
				{
					key: 'ThemeAttract',
					label: 'Theme Attract',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
					],
				},
				{
					key: 'ThemeConnectThroughContent',
					label: 'Theme Connect Through Content',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
					],
				},
				{
					key: 'ThemeCreative',
					label: 'Theme Creative',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
					],
				},
				{
					key: 'ThemeEducate',
					label: 'Theme Educate',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
					],
				},
				{
					key: 'ThemeGallery',
					label: 'Theme Gallery',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
					],
				},
				{
					key: 'ThemeMakeAnnouncement',
					label: 'Theme Make Announcement',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
					],
				},
				{
					key: 'ThemeShowcase',
					label: 'Theme Showcase',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
					],
				},
				{
					key: 'ThemeSimpleText',
					label: 'Theme Simple Text',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
					],
				},
				{
					key: 'ThemeSurvey',
					label: 'Theme Survey',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
					],
				},
				{
					key: 'ThemeWelcome',
					label: 'Theme Welcome',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
					],
				},
				{
					key: 'aurora',
					label: 'Aurora',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
						{
							key: 'visibility',
							label: 'Visibility',
							children: [{ key: 'hidden', label: 'Hidden', format: 'boolean' }],
						},
					],
				},
				{
					key: 'blank',
					label: 'Blank',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
						{
							key: 'visibility',
							label: 'Visibility',
							children: [{ key: 'hidden', label: 'Hidden', format: 'boolean' }],
						},
					],
				},
				{
					key: 'brienz',
					label: 'Brienz',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
						{
							key: 'visibility',
							label: 'Visibility',
							children: [{ key: 'hidden', label: 'Hidden', format: 'boolean' }],
						},
					],
				},
				{
					key: 'cards',
					label: 'Cards',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
						{
							key: 'visibility',
							label: 'Visibility',
							children: [{ key: 'hidden', label: 'Hidden', format: 'boolean' }],
						},
					],
				},
				{
					key: 'confirmme',
					label: 'Confirmme',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
						{
							key: 'visibility',
							label: 'Visibility',
							children: [{ key: 'hidden', label: 'Hidden', format: 'boolean' }],
						},
					],
				},
				{
					key: 'fresh-center',
					label: 'Fresh Center',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
						{
							key: 'visibility',
							label: 'Visibility',
							children: [{ key: 'hidden', label: 'Hidden', format: 'boolean' }],
						},
					],
				},
				{
					key: 'fresh-fixed',
					label: 'Fresh Fixed',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
						{
							key: 'visibility',
							label: 'Visibility',
							children: [{ key: 'hidden', label: 'Hidden', format: 'boolean' }],
						},
					],
				},
				{
					key: 'fresh-left',
					label: 'Fresh Left',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
						{
							key: 'visibility',
							label: 'Visibility',
							children: [{ key: 'hidden', label: 'Hidden', format: 'boolean' }],
						},
					],
				},
				{
					key: 'fresh-wide',
					label: 'Fresh Wide',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
						{
							key: 'visibility',
							label: 'Visibility',
							children: [{ key: 'hidden', label: 'Hidden', format: 'boolean' }],
						},
					],
				},
				{
					key: 'goldstar',
					label: 'Goldstar',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
						{
							key: 'visibility',
							label: 'Visibility',
							children: [{ key: 'hidden', label: 'Hidden', format: 'boolean' }],
						},
					],
				},
				{
					key: 'neopolitan',
					label: 'Neopolitan',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
						{
							key: 'visibility',
							label: 'Visibility',
							children: [{ key: 'hidden', label: 'Hidden', format: 'boolean' }],
						},
					],
				},
				{
					key: 'oxygen',
					label: 'Oxygen',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
						{
							key: 'visibility',
							label: 'Visibility',
							children: [{ key: 'hidden', label: 'Hidden', format: 'boolean' }],
						},
					],
				},
				{
					key: 'paprika',
					label: 'Paprika',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
						{
							key: 'visibility',
							label: 'Visibility',
							children: [{ key: 'hidden', label: 'Hidden', format: 'boolean' }],
						},
					],
				},
				{
					key: 'skyline',
					label: 'Skyline',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
						{
							key: 'visibility',
							label: 'Visibility',
							children: [{ key: 'hidden', label: 'Hidden', format: 'boolean' }],
						},
					],
				},
				{
					key: 'sparse',
					label: 'Sparse',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
						{
							key: 'visibility',
							label: 'Visibility',
							children: [{ key: 'hidden', label: 'Hidden', format: 'boolean' }],
						},
					],
				},
				{
					key: 'sunday',
					label: 'Sunday',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
						{
							key: 'visibility',
							label: 'Visibility',
							children: [{ key: 'hidden', label: 'Hidden', format: 'boolean' }],
						},
					],
				},
				{
					key: 'trulypersonal',
					label: 'Trulypersonal',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
						{
							key: 'visibility',
							label: 'Visibility',
							children: [{ key: 'hidden', label: 'Hidden', format: 'boolean' }],
						},
					],
				},
				{
					key: 'vibrant',
					label: 'Vibrant',
					children: [
						{ key: 'name', label: 'Name' },
						{ key: 'key', label: 'Key' },
						{
							key: 'visibility',
							label: 'Visibility',
							children: [{ key: 'hidden', label: 'Hidden', format: 'boolean' }],
						},
					],
				},
			],
		},
	],
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
