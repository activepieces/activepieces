import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

const ENDPOINTS: Record<string, string> = {
	document: '/v1/pdf/convert/from/doc',
	spreadsheet: '/v1/pdf/convert/from/csv',
	image: '/v1/pdf/convert/from/image',
};

export const convertDocumentToPdf = createAction({
	auth: pdfCoAuth,
	name: 'convert_document_to_pdf',
	displayName: 'Convert Document to PDF',
	description: 'Convert a Word document, spreadsheet or images to PDF.',
	audience: 'both',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Converts a Word/RTF/TXT/XPS document, a CSV/XLS/XLSX spreadsheet, or one or more images (combined into one PDF) to a PDF, given as public URLs or a file; choose the source type. Costs 21 credits per page for documents and spreadsheets, 9 for images. Not idempotent: each call runs a new job and creates a new output.',
		idempotent: false,
	},
	outputSchema: pdfCoOutputSchemas.fileResult,
	props: {
		sourceType: Property.StaticDropdown({
			displayName: 'Source Type',
			required: true,
			defaultValue: 'document',
			options: {
				disabled: false,
				options: [
					{ label: 'Document (DOC, DOCX, RTF, TXT, XPS)', value: 'document' },
					{ label: 'Spreadsheet (CSV, XLS, XLSX)', value: 'spreadsheet' },
					{ label: 'Images (JPG, PNG, TIFF...)', value: 'image' },
				],
			},
		}),
		sourceUrl: pdfCoProps.sourceUrl(),
		sourceFile: pdfCoProps.sourceFile(),
		extraImageUrls: Property.Array({
			displayName: 'More Image URLs',
			description: 'Images only: more public image links, added as further pages after the first image.',
			required: false,
		}),
		...pdfCoProps.httpAuth(),
		...pdfCoProps.output(),
	},
	async run({ auth, propsValue, files }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const path = ENDPOINTS[propsValue.sourceType];
		if (path === undefined) {
			throw new Error('Source Type must be document, spreadsheet or image.');
		}
		const extra = (Array.isArray(propsValue.extraImageUrls) ? propsValue.extraImageUrls : [])
			.map((item) => String(item ?? '').trim())
			.filter((item) => item !== '');
		if (extra.length > 0 && propsValue.sourceType !== 'image') {
			throw new Error('More Image URLs only works with Source Type "Images".');
		}
		extra.forEach((url, index) => pdfCoFiles.validateSource({ url, file: undefined, label: `Image URL #${index + 2}` }));
		const url = await pdfCoFiles.resolveSource({ apiKey, url: propsValue.sourceUrl, file: propsValue.sourceFile });
		return pdfCoJobs.runFileAction({
			apiKey,
			files,
			path,
			body: { url: [url, ...extra].join(',') },
			common: propsValue,
		});
	},
});
