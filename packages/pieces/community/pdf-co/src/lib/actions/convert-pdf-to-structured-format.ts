import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoJobs } from '../common/jobs';
import { commonProps, PDF_CO_DEFAULTS, pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

const ENDPOINTS: Record<string, string> = {
	json: '/v1/pdf/convert/to/json2',
	csv: '/v1/pdf/convert/to/csv',
	xml: '/v1/pdf/convert/to/xml',
	xlsx: '/v1/pdf/convert/to/xlsx',
	xls: '/v1/pdf/convert/to/xls',
	html: '/v1/pdf/convert/to/html',
};

export const convertPdfToStructuredFormat = createAction({
	name: 'convert_pdf_to_structured_format',
	classification: 'READ',
	displayName: 'Convert PDF to JSON/CSV/XML/Excel/HTML',
	description: 'Convert PDF content into structured formats (JSON, CSV, XML, Excel or HTML).',
	audience: 'human',
	aiMetadata: {
		description:
			'Converts a source PDF (referenced by URL) to a JSON, CSV, XML, XLSX, XLS or HTML file and returns a temporary link to the result file; optional OCR language handles scanned documents and page indexes start at 0. Agents wanting the content inline should use Convert PDF (AI). Not idempotent: each call runs a new conversion job and consumes credits.',
		idempotent: false,
	},
	auth: pdfCoAuth,
	outputSchema: pdfCoOutputSchemas.rawResult,
	props: {
		url: Property.ShortText({
			displayName: 'Source PDF URL',
			description: 'URL of the PDF file to convert.',
			required: true,
		}),
		outputFormat: Property.StaticDropdown({
			displayName: 'Output Format',
			description: 'Select the desired structured output format.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'JSON', value: 'json' },
					{ label: 'CSV', value: 'csv' },
					{ label: 'XML', value: 'xml' },
					{ label: 'Excel (XLSX)', value: 'xlsx' },
					{ label: 'Excel 97-2003 (XLS)', value: 'xls' },
					{ label: 'HTML', value: 'html' },
				],
			},
		}),
		pages: Property.ShortText({
			displayName: 'Pages',
			description: 'Comma-separated page indexes or ranges (first page is 0), e.g. "0,2,5-10". Leave empty for all pages.',
			required: false,
		}),
		lang: Property.ShortText({
			displayName: 'OCR Language',
			description: 'Language for OCR if processing scanned documents (e.g., "eng", "deu", "eng+deu"). See PDF.co docs for list.',
			required: false,
		}),
		profiles: Property.Json({
			displayName: 'Profiles',
			description: 'JSON object for additional configurations.',
			required: false,
		}),
		...commonProps,
		saveOutputFile: pdfCoProps.saveOutputFile({ defaultValue: PDF_CO_DEFAULTS.saveOutputFileOnExistingActions }),
	},
	async run({ auth, propsValue, files }) {
		const { url, outputFormat, pages, lang, pdfPassword, fileName, httpPassword, httpUsername, expiration, profiles } = propsValue;
		const path = ENDPOINTS[outputFormat];
		if (path === undefined) {
			throw new Error(`Unsupported output format: ${outputFormat}`);
		}
		const text = (value: unknown): value is string => typeof value === 'string' && value !== '';
		const serialized = pdfCoClient.serializeProfiles(profiles);
		const body = pdfCoClient.readRecord(
			await pdfCoClient.request<unknown>({
				apiKey: pdfCoClient.apiKeyOf(auth),
				method: HttpMethod.POST,
				path,
				body: {
					url,
					async: false,
					httppassword: httpPassword,
					httpusername: httpUsername,
					inline: false,
					...(text(pages) ? { pages } : {}),
					...(text(lang) ? { lang } : {}),
					...(text(pdfPassword) ? { password: pdfPassword } : {}),
					...(text(fileName) ? { name: fileName } : {}),
					...(expiration === undefined ? {} : { expiration }),
					...(serialized === undefined ? {} : { profiles: serialized }),
				},
			}),
		);
		const saved = await pdfCoJobs.optionalSave({ files, url: body['url'], enabled: propsValue.saveOutputFile, fileName });
		return { ...body, ...saved };
	},
});
