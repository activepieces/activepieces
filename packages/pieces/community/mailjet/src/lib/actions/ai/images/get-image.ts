import { createAction } from '@activepieces/pieces-framework';

import { mailjetImageOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetGetImageAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_image',
	outputSchema: mailjetImageOutputSchema,
	displayName: 'Get Image',
	description: 'Gets the metadata of one gallery image.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets an image by ID, including its URL and thumbnail URL.',
		idempotent: true,
	},
	props: {
		imageId: mailjetAiProps.id({
			displayName: 'Image ID',
			description: 'Image ID, from List Images or Upload Image.',
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: `/v1/REST/images/${encodeURIComponent(p.imageId)}`,
		});
	},
});
