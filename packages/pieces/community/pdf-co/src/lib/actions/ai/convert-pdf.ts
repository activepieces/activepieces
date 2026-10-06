import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../../auth';
import { pdfCoClient } from '../../common/client';
import { pdfCoFiles } from '../../common/files';
import { pdfCoOutputSchemas } from '../../output-schemas';

const ENDPOINTS: Record<string, string> = {
	text: '/v1/pdf/convert/to/text-simple',
	text_ocr: '/v1/pdf/convert/to/text',
	csv: '/v1/pdf/convert/to/csv',
	json: '/v1/pdf/convert/to/json2',
	xml: '/v1/pdf/convert/to/xml',
	html: '/v1/pdf/convert/to/html',
};
const DEFAULT_MAX_CHARS = 50_000;
const MAX_MAX_CHARS = 200_000;

export const pdfCoConvertPdf = createAction({
	auth: pdfCoAuth,
	name: 'pdf_co_convert_pdf',
	displayName: 'Convert PDF (AI)',
	description: 'Convert a PDF to text, CSV, JSON, XML or HTML and return the content directly.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Converts a PDF at a public URL into plain text, OCR text (for scans), CSV, JSON, XML or HTML and returns the converted content directly, cut to max_chars with a truncated flag. Use when the agent needs to read a PDF\'s content; pages are 0-based. Credits per page: text 4, text_ocr 21, csv/json 28, xml 35, html 21. Read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: pdfCoOutputSchemas.aiConvert,
	props: {
		source_url: Property.ShortText({
			displayName: 'Source URL',
			description: 'Public http(s) URL of the PDF.',
			required: true,
		}),
		format: Property.ShortText({
			displayName: 'Format',
			description: 'One of: text, text_ocr, csv, json, xml, html. Default text.',
			required: false,
		}),
		pages: Property.ShortText({
			displayName: 'Pages',
			description: 'Optional 0-based pages or ranges, e.g. "0,2-4". Empty = all pages.',
			required: false,
		}),
		lang: Property.ShortText({
			displayName: 'OCR Language',
			description: 'Optional OCR language for text_ocr, csv, json, xml and html, e.g. "eng" or "eng+deu".',
			required: false,
		}),
		password: Property.ShortText({
			displayName: 'PDF Password',
			description: 'Optional password if the PDF is protected.',
			required: false,
		}),
		max_chars: Property.Number({
			displayName: 'Max Characters',
			description: `Maximum characters of content to return (default ${DEFAULT_MAX_CHARS}, max ${MAX_MAX_CHARS}).`,
			required: false,
		}),
	},
	async run({ auth, propsValue }) {
		const format = (pdfCoFiles.nonEmptyString(propsValue.format) ?? 'text').trim().toLowerCase();
		const path = ENDPOINTS[format];
		if (path === undefined) {
			throw new Error(`format must be one of: ${Object.keys(ENDPOINTS).join(', ')}.`);
		}
		const maxChars = propsValue.max_chars === undefined || propsValue.max_chars === null ? DEFAULT_MAX_CHARS : Number(propsValue.max_chars);
		if (!Number.isInteger(maxChars) || maxChars < 1 || maxChars > MAX_MAX_CHARS) {
			throw new Error(`max_chars must be a whole number from 1 to ${MAX_MAX_CHARS}.`);
		}
		const lang = pdfCoFiles.nonEmptyString(propsValue.lang);
		if (lang !== undefined && format === 'text') {
			throw new Error('lang does not apply to format "text"; use "text_ocr" for OCR.');
		}
		pdfCoFiles.validateSource({ url: propsValue.source_url, file: undefined, label: 'source_url' });
		const pages = pdfCoFiles.nonEmptyString(propsValue.pages);
		const password = pdfCoFiles.nonEmptyString(propsValue.password);
		const body = await convertInline({
			apiKey: pdfCoClient.apiKeyOf(auth),
			path,
			body: {
				url: propsValue.source_url.trim(),
				...(pages === undefined ? {} : { pages: pages.trim() }),
				...(lang === undefined ? {} : { lang: lang.trim() }),
				...(password === undefined ? {} : { password }),
			},
		});
		const raw = body['body'];
		const content = typeof raw === 'string' ? raw : raw === undefined || raw === null ? '' : JSON.stringify(raw);
		return {
			format,
			content: content.slice(0, maxChars),
			truncated: content.length > maxChars,
			total_chars: content.length,
			page_count: body['pageCount'],
			credits_used: body['credits'],
			remaining_credits: body['remainingCredits'],
		};
	},
});

async function convertInline({
	apiKey,
	path,
	body,
}: {
	apiKey: string;
	path: string;
	body: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
	const response = await pdfCoClient.request<unknown>({
		apiKey,
		method: HttpMethod.POST,
		path,
		body: { ...body, async: false, inline: true },
	});
	return pdfCoClient.readRecord(response);
}
