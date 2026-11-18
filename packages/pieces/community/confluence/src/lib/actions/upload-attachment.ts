import { createAction, Property } from '@activepieces/pieces-framework';
import { confluenceAuth } from '../auth';
import { confluenceApi } from '../common/api';
import { confluenceProps } from '../common/props';
import { uploadAttachmentOutputSchema } from '../output-schemas';

export const uploadAttachmentAction = createAction({
	auth: confluenceAuth,
	name: 'upload-attachment',
	outputSchema: uploadAttachmentOutputSchema,
	classification: 'WRITE',
	displayName: 'Upload Attachment',
	description: 'Uploads a file as an attachment to a page.',
	audience: 'human',
	aiMetadata: { description: 'Uploads a file as an attachment on a Confluence page via multipart form upload, with an optional version comment and a minor-edit flag to suppress watcher notifications. Use to attach a document or image to a page. Requires the page ID and the file. Uploading the same filename again creates a new version rather than a duplicate, but each call still mutates state, so treat as not idempotent.', idempotent: false },
	props: {
		spaceId: confluenceProps.spaceId({ required: true }),
		pageId: confluenceProps.pageId({ required: true }),
		file: Property.File({
			displayName: 'File',
			required: true,
		}),
		comment: Property.ShortText({
			displayName: 'Version Comment',
			description: 'Optional comment associated with this attachment version.',
			required: false,
		}),
		minorEdit: Property.Checkbox({
			displayName: 'Minor Edit',
			description: 'If enabled, no notifications are sent to page watchers.',
			required: false,
			defaultValue: true,
		}),
	},
	async run(context) {
		const { pageId, file, comment, minorEdit } = context.propsValue;

		return await confluenceApi.uploadAttachment({
			auth: context.auth,
			pageId,
			file,
			comment,
			minorEdit,
		});
	},
});
