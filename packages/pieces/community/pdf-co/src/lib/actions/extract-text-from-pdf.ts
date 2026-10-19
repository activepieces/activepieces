import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { commonProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const extractTextFromPdf = createAction({
	name: 'extract_text_from_pdf',
	classification: 'READ',
	displayName: 'Extract Plain Text from PDF',
	description: 'Extracts plain text content from a PDF document.',
	audience: 'both',
	aiMetadata: {
		description:
			'Extracts the text of a source PDF (referenced by URL), optionally limited to specific pages (first page is 0). By default it reads the embedded text (4 credits per page); turn on OCR for scanned documents or layout-preserving text (21 credits per page). Use when an agent needs the raw text of a document. Read-only and idempotent.',
		idempotent: true,
	},
	auth: pdfCoAuth,
	outputSchema: pdfCoOutputSchemas.extractText,
	props: {
		url: Property.ShortText({
			displayName: 'Source PDF URL',
			description: 'URL of the PDF file to extract text from.',
			required: true,
		}),
		pages: Property.ShortText({
			displayName: 'Pages',
			description: 'Comma-separated page indexes or ranges (first page is 0), e.g. "0,2,5-10". Leave empty for all pages.',
			required: false,
		}),
		password: commonProps.pdfPassword,
		outputName: commonProps.fileName,
		httpUsername: commonProps.httpUsername,
		httpPassword: commonProps.httpPassword,
		useOcr: Property.Checkbox({
			displayName: 'Use OCR (Scanned PDFs)',
			description: 'Read scanned pages and keep the layout. Costs 21 credits per page instead of 4.',
			required: false,
			defaultValue: false,
		}),
		lang: Property.ShortText({
			displayName: 'OCR Language',
			description: 'Only with OCR: language of the text, e.g. "eng", "deu", or "eng+deu". Default "eng".',
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const { url, pages, password, outputName, httpPassword, httpUsername, useOcr, lang } = propsValue;
		const text = (value: unknown): value is string => typeof value === 'string' && value !== '';
		if (text(lang) && useOcr !== true) {
			throw new Error('OCR Language only applies when "Use OCR" is on.');
		}
		const body = pdfCoClient.readRecord(
			await pdfCoClient.request<unknown>({
				apiKey: pdfCoClient.apiKeyOf(auth),
				method: HttpMethod.POST,
				path: useOcr === true ? '/v1/pdf/convert/to/text' : '/v1/pdf/convert/to/text-simple',
				body: {
					url,
					async: false,
					httpusername: httpUsername,
					httppassword: httpPassword,
					inline: true,
					...(text(pages) ? { pages } : {}),
					...(text(password) ? { password } : {}),
					...(text(outputName) ? { name: outputName } : {}),
					...(useOcr === true && text(lang) ? { lang } : {}),
				},
			}),
		);
		return {
			extractedText: body['body'],
			pageCount: body['pageCount'],
			outputName: body['name'],
			creditsUsed: body['credits'],
			remainingCredits: body['remainingCredits'],
		};
	},
});
