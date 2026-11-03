import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

const BARCODE_TYPES = [
	{ label: 'QR Code', value: 'QRCode' },
	{ label: 'DataMatrix', value: 'DataMatrix' },
	{ label: 'Code 128', value: 'Code128' },
	{ label: 'Code 39', value: 'Code39' },
	{ label: 'PDF417', value: 'PDF417' },
	{ label: 'EAN-13', value: 'EAN13' },
	{ label: 'UPC-A', value: 'UPCA' },
	{ label: 'Interleaved 2 of 5', value: 'Interleaved2of5' },
];

export const readBarcodes = createAction({
	auth: pdfCoAuth,
	name: 'read_barcodes_from_file',
	displayName: 'Read Barcodes',
	description: 'Find and decode barcodes and QR codes in a PDF or image.',
	audience: 'both',
	classification: 'READ',
	aiMetadata: {
		description:
			'Detects and decodes barcodes and QR codes in a PDF or image (public URL or file), returning each value, type, page (0-based), position and confidence. Choose the barcode types to look for. Costs 35 credits per page. Read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: pdfCoOutputSchemas.readBarcodes,
	props: {
		sourceUrl: pdfCoProps.sourceUrl({ description: 'Public link to the PDF or image. Fill this or pick a file below, not both.' }),
		sourceFile: pdfCoProps.sourceFile(),
		types: Property.StaticMultiSelectDropdown({
			displayName: 'Barcode Types',
			description: 'Which barcode types to look for. Fewer types read faster.',
			required: true,
			defaultValue: ['QRCode', 'Code128', 'Code39', 'EAN13', 'DataMatrix'],
			options: { disabled: false, options: BARCODE_TYPES },
		}),
		pages: pdfCoProps.pages({ base: 0 }),
		...pdfCoProps.httpAuth(),
	},
	async run({ auth, propsValue }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const allowed = new Set(BARCODE_TYPES.map((option) => option.value));
		const types = (Array.isArray(propsValue.types) ? propsValue.types : []).map((type) => String(type));
		if (types.length === 0) {
			throw new Error('Pick at least one barcode type.');
		}
		const unknown = types.filter((type) => !allowed.has(type));
		if (unknown.length > 0) {
			throw new Error(`Unknown barcode type: ${unknown.join(', ')}.`);
		}
		const pages = pdfCoFiles.nonEmptyString(propsValue.pages);
		const url = await pdfCoFiles.resolveSource({ apiKey, url: propsValue.sourceUrl, file: propsValue.sourceFile });
		const body = await pdfCoJobs.runInline({
			apiKey,
			path: '/v1/barcode/read/from/url',
			body: { url, types: types.join(','), ...(pages === undefined ? {} : { pages: pages.trim() }) },
			common: propsValue,
		});
		const raw = body['barcodes'];
		const barcodes = (Array.isArray(raw) ? raw : []).map((item) => {
			const barcode = pdfCoClient.readRecord(item);
			return {
				value: barcode['Value'],
				type: barcode['TypeName'],
				page: barcode['Page'],
				rect: barcode['Rect'],
				confidence: barcode['Confidence'],
			};
		});
		return {
			barcode_count: barcodes.length,
			barcodes,
			page_count: body['pageCount'],
			credits_used: body['credits'],
			remaining_credits: body['remainingCredits'],
		};
	},
});
