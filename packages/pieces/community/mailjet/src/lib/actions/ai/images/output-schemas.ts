import { OutputSchema } from '@activepieces/pieces-framework';

import { mailjetSchemaUtils } from '../../../output-schemas';

const imageFields: OutputSchema['fields'] = [
	{ key: 'ID', label: 'ID' },
	{ key: 'OrganisationID', label: 'Organisation ID', format: 'number' },
	{ key: 'Name', label: 'Name' },
	{ key: 'Status', label: 'Status' },
	{ key: 'TargetContent', label: 'Target Content' },
	{ key: 'ImageSize', label: 'Image Size', format: 'filesize' },
	{ key: 'ThumbnailSize', label: 'Thumbnail Size', format: 'filesize' },
	{ key: 'TotalSize', label: 'Total Size', format: 'filesize' },
	{ key: 'LabelIDs', label: 'Label IDs' },
	{ key: 'IsStarred', label: 'Is Starred', format: 'boolean' },
	{ key: 'ImageUrl', label: 'Image URL', format: 'image' },
	{ key: 'ThumbnailUrl', label: 'Thumbnail URL', format: 'image' },
	{ key: 'CreatedAt', label: 'Created At', format: 'datetime' },
	{ key: 'UpdatedAt', label: 'Updated At', format: 'datetime' },
	{ key: 'ExpiresAt', label: 'Expires At', format: 'datetime' },
];

export const mailjetImageOutputSchema: OutputSchema = mailjetSchemaUtils.envelope({
	label: 'Images',
	labelKey: 'Name',
	fields: imageFields,
});
