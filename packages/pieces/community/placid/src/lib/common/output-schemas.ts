import { OutputSchema } from '@activepieces/pieces-framework';

type Fields = OutputSchema['fields'];

const renderFields = ({ urlKey, urlLabel }: { urlKey: string; urlLabel: string }): Fields => [
	{ key: 'id', label: 'ID' },
	{ key: 'status', label: 'Status', description: 'queued, finished or error.' },
	{ key: urlKey, label: urlLabel, format: 'url', description: 'Empty until status is finished.' },
	{ key: 'polling_url', label: 'Polling URL', format: 'url' },
	{ key: 'error_code', label: 'Error Code' },
	{ key: 'error_message', label: 'Error Message' },
	{
		key: 'error_details',
		label: 'Error Details',
		listItems: [
			{ key: 'layer', label: 'Layer' },
			{ key: 'message', label: 'Message' },
		],
	},
	{ key: 'passthrough', label: 'Passthrough' },
];

const layerItems: Fields = [
	{ key: 'name', label: 'Layer Name' },
	{ key: 'type', label: 'Layer Type' },
];

const templateFields: Fields = [
	{ key: 'uuid', label: 'Template UUID' },
	{ key: 'title', label: 'Title' },
	{ key: 'thumbnail', label: 'Thumbnail', format: 'image' },
	{ key: 'width', label: 'Width', format: 'number' },
	{ key: 'height', label: 'Height', format: 'number' },
	{ key: 'tags', label: 'Tags' },
	{ key: 'layers', label: 'Layers', labelKey: 'name', listItems: layerItems },
];

const deletedFields: Fields = [
	{ key: 'deleted', label: 'Deleted', format: 'boolean' },
	{ key: 'id', label: 'ID' },
];

export const placidSchemas = {
	image: { fields: renderFields({ urlKey: 'image_url', urlLabel: 'Image URL' }) },
	pdf: { fields: renderFields({ urlKey: 'pdf_url', urlLabel: 'PDF URL' }) },
	video: { fields: renderFields({ urlKey: 'video_url', urlLabel: 'Video URL' }) },
	template: { fields: templateFields },
	templates: {
		fields: [
			{ key: 'templates', label: 'Templates', labelKey: 'title', listItems: templateFields },
			{ key: 'has_more', label: 'Has More', format: 'boolean' },
		],
	},
	collections: {
		fields: [
			{
				key: 'collections',
				label: 'Collections',
				labelKey: 'title',
				listItems: [
					{ key: 'id', label: 'Collection ID' },
					{ key: 'title', label: 'Title' },
					{ key: 'template_uuids', label: 'Template UUIDs' },
				],
			},
		],
	},
	media: {
		fields: [
			{
				key: 'media',
				label: 'Media',
				listItems: [
					{ key: 'file_key', label: 'File Key' },
					{ key: 'file_id', label: 'File URL', format: 'url' },
				],
			},
			{ key: 'url', label: 'URL', format: 'url', description: 'URL of the uploaded file, ready for a picture layer.' },
		],
	},
	deleted: { fields: deletedFields },
} satisfies Record<string, OutputSchema>;
