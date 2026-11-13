import { createAction } from '@activepieces/pieces-framework';

import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetDeletedOutputSchema } from '../../../output-schemas';

export const mailjetDeleteImageAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_delete_image',
	outputSchema: mailjetDeletedOutputSchema,
	displayName: 'Delete Image',
	description: 'Deletes a gallery image.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes an image from the gallery. Emails already sent keep working only if they host their own copy.',
		idempotent: false,
	},
	props: {
		imageId: mailjetAiProps.id({
			displayName: 'Image ID',
			description: 'Image ID, from List Images or Upload Image.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.remove({
			auth: context.auth,
			path: `/v1/REST/images/${encodeURIComponent(p.imageId)}`,
		});
	},
});
