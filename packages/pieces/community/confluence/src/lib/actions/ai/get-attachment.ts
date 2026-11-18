import { createAction, Property } from '@activepieces/pieces-framework';

import { confluenceAuth } from '../../auth';
import { confluenceAiProps } from '../../common/ai-props';
import { confluenceApi } from '../../common/api';
import { confluenceGetAttachmentOutputSchema } from '../../output-schemas';

export const getAttachmentAction = createAction({
	auth: confluenceAuth,
	name: 'confluence_get_attachment',
	outputSchema: confluenceGetAttachmentOutputSchema,
	displayName: 'Get Attachment',
	description: 'Gets the details of an attachment.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Gets the metadata of one Confluence attachment: title, media type, size, version, the page or blog post it belongs to, and its download link. Use Download Attachment to get the file itself.',
		idempotent: true,
	},
	props: {
		attachmentId: confluenceAiProps.attachmentId({ required: true }),
		includeLabels: Property.Checkbox({ displayName: 'Include Labels', required: false }),
		includeVersions: Property.Checkbox({ displayName: 'Include Versions', required: false }),
	},
	async run(context) {
		const { attachmentId, includeLabels, includeVersions } = context.propsValue;
		return await confluenceApi.getContent({
			auth: context.auth,
			contentType: 'attachments',
			contentId: attachmentId,
			query: {
				'include-labels': includeLabels || undefined,
				'include-versions': includeVersions || undefined,
			},
		});
	},
});
