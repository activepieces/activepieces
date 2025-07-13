import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { placidAuth } from '../common/auth';
import { placidApiCall } from '../common/client';

export const createPdfAction = createAction({
	name: 'create-pdf',
	auth: placidAuth,
	displayName: 'Create PDF',
	description: 'Generate a PDF from one or more templates using input data.',
	props: {
		webhook_success: Property.ShortText({
			displayName: 'Webhook Success URL',
			required: false,
			description: 'Placid will send a POST request to this URL after PDF is generated.',
		}),
		passthrough: Property.ShortText({
			displayName: 'Passthrough',
			required: false,
			description: 'Extra data returned in subsequent webhook callbacks (max 1024 chars).',
		}),
		pages: Property.Json({
			displayName: 'Pages',
			required: true,
			description: `Array of pages with \`template_uuid\` and \`layers\`. Example:\n\`\`\`json\n[\n  {\n    "template_uuid": "tpl-abc123",\n    "layers": {\n      "title": { "text": "Hello" },\n      "image": { "image": "https://..." }\n    }\n  }\n]\n\`\`\``,
		}),
		modifications: Property.Json({
			displayName: 'Modifications',
			required: false,
			description: `PDF output options (e.g., filename, dpi, color_mode). Example:\n\`\`\`json\n{\n  "filename": "my-doc.pdf",\n  "dpi": 150,\n  "color_mode": "cmyk",\n  "color_profile": "cmyk-profile-1"\n}\n\`\`\``,
		}),
		transfer: Property.Json({
			displayName: 'Transfer',
			required: false,
			description: `Transfer the PDF to S3. Example:\n\`\`\`json\n{\n  "to": "s3",\n  "key": "...",\n  "secret": "...",\n  "region": "...",\n  "bucket": "...",\n  "visibility": "public",\n  "path": "pdfs/output.pdf",\n  "endpoint": "https://...",\n  "token": "..." // optional\n}\n\`\`\``,
		}),
	},
	async run({ propsValue, auth }) {
		const {
			webhook_success,
			passthrough,
			pages,
			modifications,
			transfer,
		} = propsValue;

		const body = {
			webhook_success,
			passthrough,
			pages,
			modifications,
			transfer,
		};

		const response = await placidApiCall({
			apiKey: auth,
			method: HttpMethod.POST,
			resourceUri: '/pdfs',
			body,
		});

		return response;
	},
});
