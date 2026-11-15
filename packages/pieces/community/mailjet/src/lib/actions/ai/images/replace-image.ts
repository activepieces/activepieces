import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetImageOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';

export const mailjetReplaceImageAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_replace_image',
	outputSchema: mailjetImageOutputSchema,
	displayName: 'Replace Image',
	description: 'Replaces the file of a gallery image or uploads its thumbnail.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Replaces the image file of an existing gallery image (Content) or uploads its thumbnail (Thumbnail). The image keeps its ID.',
		idempotent: true,
	},
	props: {
		imageId: mailjetAiProps.id({
			displayName: 'Image ID',
			description: 'Image ID, from List Images or Upload Image.',
		}),
		target: Property.StaticDropdown({
			displayName: 'Target',
			description: 'content replaces the image itself, thumbnail sets its thumbnail.',
			required: true,
			options: {
				options: [
					{ label: 'content', value: 'content' },
					{ label: 'thumbnail', value: 'thumbnail' },
				],
			},
		}),
		file: Property.File({
			displayName: 'File',
			description: 'Image file, max 2 MB.',
			required: true,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.replaceImage({
			auth: context.auth,
			imageId: p.imageId,
			contentType: p.target,
			file: p.file,
		});
	},
});
