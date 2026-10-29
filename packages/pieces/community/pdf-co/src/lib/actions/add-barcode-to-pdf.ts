import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoJobs } from '../common/jobs';
import { BARCODE_TYPES, commonProps, PDF_CO_DEFAULTS, pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const addBarcodeToPdf = createAction({
	name: 'add_barcode_to_pdf',
	classification: 'WRITE',
	displayName: 'Add Barcode to PDF',
	description: 'Generate a barcode image and add it to a specific location on a PDF.',
	audience: 'both',
	aiMetadata: {
		description:
			'Generates a barcode (QR, DataMatrix, Code 128/39, PDF417, EAN-13, or UPC-A) and stamps it onto a source PDF (referenced by URL) at the given x/y coordinates (points from the top-left; page indexes start at 0). Use when an agent needs to embed a scannable code into an existing document. Each call produces a new output PDF file and consumes credits, so it is not idempotent.',
		idempotent: false,
	},
	auth: pdfCoAuth,
	outputSchema: pdfCoOutputSchemas.rawResult,
	props: {
		sourcePdfUrl: Property.ShortText({
			displayName: 'Source PDF URL',
			description: 'URL of the PDF file to add the barcode to.',
			required: true,
		}),
		barcodeValue: Property.ShortText({
			displayName: 'Barcode Value',
			description: 'The text or data to encode in the barcode.',
			required: true,
		}),
		barcodeType: Property.StaticDropdown({
			displayName: 'Barcode Type',
			description: 'Select the type of barcode to generate.',
			required: true,
			options: { disabled: false, options: BARCODE_TYPES, placeholder: 'Select Barcode Type' },
		}),
		x: Property.Number({
			displayName: 'X Coordinate',
			description: 'X coordinate (from top-left corner) to place the barcode.',
			required: true,
		}),
		y: Property.Number({
			displayName: 'Y Coordinate',
			description: 'Y coordinate (from top-left corner) to place the barcode.',
			required: true,
		}),
		width: Property.Number({
			displayName: 'Width (optional)',
			description:
				'Optional width for the barcode image on the PDF (in points). Aspect ratio is kept by default.',
			required: false,
		}),
		height: Property.Number({
			displayName: 'Height (optional)',
			description:
				'Optional height for the barcode image on the PDF (in points). Aspect ratio is kept by default.',
			required: false,
		}),
		pages: Property.ShortText({
			displayName: 'Pages',
			description:
				'Comma-separated page indexes or ranges to add the barcode (first page is 0), e.g. "0,2,5-10". Leave empty for all pages.',
			required: false,
		}),
		...commonProps,
		saveOutputFile: pdfCoProps.saveOutputFile({ defaultValue: PDF_CO_DEFAULTS.saveOutputFileOnExistingActions }),
	},
	async run({ auth, propsValue, files }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const generated = pdfCoClient.readRecord(
			await pdfCoClient.request<unknown>({
				apiKey,
				method: HttpMethod.POST,
				path: '/v1/barcode/generate',
				body: { value: propsValue.barcodeValue, type: propsValue.barcodeType, async: false, inline: false },
			}),
		);
		const barcodeImageUrl = generated['url'];
		if (typeof barcodeImageUrl !== 'string' || barcodeImageUrl === '') {
			throw new Error('Failed to get barcode image URL from PDF.co response.');
		}
		const result = pdfCoClient.readRecord(
			await pdfCoClient.request<unknown>({
				apiKey,
				method: HttpMethod.POST,
				path: '/v1/pdf/edit/add',
				body: {
					url: propsValue.sourcePdfUrl,
					images: [
						{
							url: barcodeImageUrl,
							x: propsValue.x,
							y: propsValue.y,
							width: propsValue.width,
							height: propsValue.height,
							pages: propsValue.pages,
						},
					],
					async: false,
					inline: false,
					name: propsValue.fileName,
					expiration: propsValue.expiration,
					httppassword: propsValue.httpPassword,
					httpusername: propsValue.httpUsername,
					password: propsValue.pdfPassword,
				},
			}),
		);
		const saved = await pdfCoJobs.optionalSave({
			files,
			url: result['url'],
			enabled: propsValue.saveOutputFile,
			fileName: propsValue.fileName,
		});
		return { ...result, ...saved };
	},
});
