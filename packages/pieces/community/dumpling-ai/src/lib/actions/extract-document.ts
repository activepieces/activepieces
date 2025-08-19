import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dumplingAuth } from '../../index';

export const extractDocument = createAction({
	name: 'extract_document',
	auth: dumplingAuth,
	displayName: 'Extract Document Data',
	description: 'Extract structured data from documents using vision-capable AI.',
	props: {
		file: Property.File({
			displayName: 'File',
			required: true,
			description: 'File URL or base64-encoded file.',
		}),
		prompt: Property.LongText({
			displayName: 'Extraction Prompt',
			required: true,
			description: 'The prompt describing what data to extract from the document.',
		}),
		jsonMode: Property.Checkbox({
			displayName: 'JSON Mode',
			required: false,
			defaultValue: false,
			description: 'Whether to return the result in JSON format.',
		}),
	},
	async run(context) {
		const { file, prompt, jsonMode } = context.propsValue;

		const requestBody: Record<string, any> = {
			inputMethod: 'base64',
			files: [file.base64],
			prompt,
		};

		// Add optional parameters if provided
		if (jsonMode !== undefined) requestBody['jsonMode'] = jsonMode;

		const response = await httpClient.sendRequest({
			method: HttpMethod.POST,
			url: 'https://app.dumplingai.com/api/v1/extract-document',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${context.auth}`,
			},
			body: requestBody,
		});

		return response.body;
	},
});
