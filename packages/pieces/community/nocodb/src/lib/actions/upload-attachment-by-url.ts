import { nocodbAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { nocodbUploadAttachmentByUrlOutputSchema } from '../output-schemas';

export const uploadAttachmentByUrlAction = createAction({
	auth: nocodbAuth,
	name: 'nocodb-upload-attachment-by-url',
	outputSchema: nocodbUploadAttachmentByUrlOutputSchema,
	classification: 'WRITE',
	displayName: 'Upload Attachment By URL',
	description: 'Uploads a file to NocoDB storage from a public URL, for use in an attachment column.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Fetches a file from a public URL and stores it in NocoDB storage, returning the attachment metadata to place into an attachment column value on a subsequent create/update record call. Not idempotent: each call stores another copy of the file.',
		idempotent: false,
	},
	props: {
		url: Property.ShortText({
			displayName: 'File URL',
			required: true,
		}),
		path: Property.ShortText({
			displayName: 'Target Path',
			description: 'The storage path to upload to, e.g. download/noco/<base>/<table>/attachment.',
			required: true,
		}),
		title: Property.ShortText({
			displayName: 'Title',
			description: 'Display name for the attachment.',
			required: false,
		}),
		mimetype: Property.ShortText({
			displayName: 'MIME Type',
			required: false,
		}),
	},
	async run(context) {
		const { url, path, title, mimetype } = context.propsValue;
		const client = makeClient(context.auth);
		return await client.uploadAttachmentByUrl(path, { url, title, mimetype });
	},
});
