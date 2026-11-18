import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceUploadAttachmentOutputSchema } from '../../output-schemas';

export const uploadAttachmentAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_upload_attachment',
	outputSchema: confluenceUploadAttachmentOutputSchema,
	displayName: 'Upload Attachment',
	description: 'Uploads a file as an attachment to a page or blog post.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Uploads a file as an attachment to a Confluence page or blog post. Uploading a file whose name already exists on that page fails; the response lists the new attachment with its ID. Not idempotent: each call uploads again.',
		idempotent: false,
	},
	props: {
		contentId: confluenceAiProps.pageId({
			required: true,
			displayName: 'Page or Blog Post ID',
			description:
				'Numeric ID of the page or blog post to attach to, from List Pages or List Blog Posts.',
		}),
		file: Property.File({ displayName: 'File', required: true }),
		comment: Property.ShortText({
			displayName: 'Comment',
			description: 'Optional comment for this attachment version.',
			required: false,
		}),
		minorEdit: Property.Checkbox({
			displayName: 'Minor Edit',
			description: 'Do not notify watchers about the upload. Defaults to true.',
			required: false,
			defaultValue: true,
		}),
	},
	async run(context) {
		const { contentId, file, comment, minorEdit } = context.propsValue;
		return await confluenceApi.uploadAttachment({
			auth: context.auth,
			pageId: contentId,
			file,
			comment,
			minorEdit,
		});
	},
});
