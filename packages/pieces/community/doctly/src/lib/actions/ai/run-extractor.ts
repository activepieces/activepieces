import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { doctlyAuth } from '../../auth';
import { doctlyClient } from '../../common/client';
import { doctlyAiProps } from '../../common/ai-props';
import { doctlyRunExtractorOutputSchema } from '../../output-schemas';

export const runExtractorAction = createAction({
	auth: doctlyAuth,
	name: 'doctly_run_extractor',
	outputSchema: doctlyRunExtractorOutputSchema,
	displayName: 'Run Extractor',
	description: 'Starts running an extractor on a document.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Starts running an extractor on a PDF, DOCX or image to pull out structured data; returns the new document id and its status right away. Poll Get Document with that id until status is COMPLETED to read the extracted data. Takes the extractor\'s slug from List Extractors. Spends credits; each call creates a new document.',
		idempotent: false,
	},
	props: {
		slug: Property.ShortText({ displayName: 'Extractor Slug', description: 'The extractor\'s slug, e.g. "invoice-parser". Use List Extractors to find it.', required: true }),
		file: doctlyAiProps.file({ required: true }),
		inputs: Property.Json({ displayName: 'Inputs', description: 'Optional runtime inputs the extractor defines, as a JSON object.', required: false }),
	},
	async run(context) {
		const { slug, file, inputs } = context.propsValue;
		const formData = new FormData();
		formData.append('file', file.data, { filename: file.filename });
		if (inputs !== undefined && Object.keys(inputs).length > 0) {
			formData.append('inputs', JSON.stringify(inputs));
		}
		return await doctlyClient.request({
			auth: context.auth,
			method: HttpMethod.POST,
			path: `/e/${encodeURIComponent(slug)}`,
			headers: formData.getHeaders(),
			body: formData,
		});
	},
});
