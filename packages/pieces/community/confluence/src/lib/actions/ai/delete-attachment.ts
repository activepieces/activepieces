import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceDeleteAttachmentOutputSchema } from '../../output-schemas';

export const deleteAttachmentAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_delete_attachment',
	outputSchema: confluenceDeleteAttachmentOutputSchema,
	displayName: 'Delete Attachment',
	description: 'Moves an attachment to the trash, or purges it.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Deletes a Confluence attachment by ID. By default it moves it to the trash (recoverable); Purge permanently removes an attachment that is already in the trash. Not idempotent: deleting again returns an error.',
		idempotent: false,
	},
	props: {
		attachmentId: confluenceAiProps.attachmentId({ required: true }),
		purge: Property.Checkbox({
			displayName: 'Purge',
			description:
				'Permanently delete an attachment that is already in the trash. Cannot be undone.',
			required: false,
		}),
	},
	async run(context) {
		const { attachmentId, purge } = context.propsValue;
		await confluenceApi.deleteContent({
			auth: context.auth,
			contentType: 'attachments',
			contentId: attachmentId,
			query: { purge: purge || undefined },
		});
		return { deleted: true, attachmentId };
	},
});
