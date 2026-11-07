import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { doctlyAuth } from '../../auth';
import { doctlyClient } from '../../common/client';
import { doctlyAiProps } from '../../common/ai-props';
import { doctlyConvertDocumentOutputSchema } from '../../output-schemas';

const ACCURACY_OPTIONS = [
	{ label: 'Lite', value: 'lite' },
	{ label: 'Ultra', value: 'ultra' },
];

export const convertDocumentAction = createAction({
	auth: doctlyAuth,
	name: 'doctly_convert_document',
	outputSchema: doctlyConvertDocumentOutputSchema,
	displayName: 'Convert Document',
	description: 'Starts converting a document to markdown.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Uploads a PDF, DOCX or image to Doctly and starts converting it to markdown; returns the new document id and its status right away. Poll Get Document with that id until status is COMPLETED to read the markdown. Spends credits per page; each call creates a new document.',
		idempotent: false,
	},
	props: {
		file: doctlyAiProps.file({ required: true }),
		accuracy: Property.StaticDropdown({
			displayName: 'Accuracy',
			description: '"lite" is faster and cheaper, "ultra" is more accurate. Defaults to the account setting.',
			required: false,
			options: { options: ACCURACY_OPTIONS },
		}),
		pageSeparator: doctlyAiProps.booleanFlag({
			required: false,
			displayName: 'Page Separator',
			description: 'Whether to mark page breaks in the markdown. Defaults to true.',
		}),
		skipImages: doctlyAiProps.booleanFlag({
			required: false,
			displayName: 'Skip Images',
			description: 'Whether to leave out descriptions of images. Defaults to false.',
		}),
	},
	async run(context) {
		const { file, accuracy, pageSeparator, skipImages } = context.propsValue;
		if (accuracy !== undefined && !ACCURACY_OPTIONS.some((option) => option.value === accuracy)) {
			throw new Error('accuracy must be "lite" or "ultra".');
		}
		const formData = new FormData();
		formData.append('file', file.data, { filename: file.filename });
		if (accuracy !== undefined) {
			formData.append('accuracy', accuracy);
		}
		if (pageSeparator !== undefined) {
			formData.append('page_separator', pageSeparator);
		}
		if (skipImages !== undefined) {
			formData.append('skip_images', skipImages);
		}
		return await doctlyClient.request({
			auth: context.auth,
			method: HttpMethod.POST,
			path: '/documents/',
			headers: formData.getHeaders(),
			body: formData,
		});
	},
});
