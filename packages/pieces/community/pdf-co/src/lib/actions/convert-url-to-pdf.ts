import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const convertUrlToPdf = createAction({
	auth: pdfCoAuth,
	name: 'convert_url_to_pdf',
	displayName: 'Convert Web Page to PDF',
	description: 'Turn a public web page into a PDF.',
	audience: 'both',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Renders a public web page URL into a PDF with optional paper size, orientation, margins, header and footer, returning a temporary link and optionally the file. The page must be reachable without login. Costs 9 credits per page. Not idempotent: each call runs a new job and creates a new output.',
		idempotent: false,
	},
	outputSchema: pdfCoOutputSchemas.fileResult,
	props: {
		pageUrl: Property.ShortText({
			displayName: 'Web Page URL',
			description: 'The public page to convert, e.g. https://example.com/report.',
			required: true,
		}),
		...pdfCoProps.pageLayout(),
		renderTimeout: Property.Number({
			displayName: 'Render Wait (ms)',
			description: 'Extra time to let heavy JavaScript pages finish rendering, in milliseconds.',
			required: false,
		}),
		...pdfCoProps.output(),
	},
	async run({ auth, propsValue, files }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		pdfCoFiles.validateSource({ url: propsValue.pageUrl, file: undefined, label: 'Web Page' });
		const timeout = propsValue.renderTimeout;
		if (timeout !== undefined && timeout !== null && (!Number.isInteger(Number(timeout)) || Number(timeout) < 0)) {
			throw new Error('Render Wait must be a whole number of milliseconds.');
		}
		return pdfCoJobs.runFileAction({
			apiKey,
			files,
			path: '/v1/pdf/convert/from/url',
			body: {
				url: propsValue.pageUrl.trim(),
				...pdfCoProps.pageLayoutBody(propsValue),
				...(timeout === undefined || timeout === null ? {} : { renderTimeout: Number(timeout) }),
			},
			common: propsValue,
		});
	},
});
