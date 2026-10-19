import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { BARCODE_TYPES, pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const generateBarcode = createAction({
	auth: pdfCoAuth,
	name: 'generate_barcode',
	displayName: 'Generate Barcode Image',
	description: 'Create a QR code or barcode image for a value.',
	audience: 'both',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Generates a QR code or barcode image (QR, DataMatrix, Code 128/39, PDF417, EAN-13, UPC-A) for a value and returns a temporary PNG link, optionally saving the file. Use Add Barcode to PDF to stamp one onto a document. Costs 7 credits per call. Not idempotent: each call creates a new image.',
		idempotent: false,
	},
	outputSchema: pdfCoOutputSchemas.fileResult,
	props: {
		value: Property.ShortText({
			displayName: 'Value',
			description: 'The text, number or link to encode.',
			required: true,
		}),
		type: Property.StaticDropdown({
			displayName: 'Barcode Type',
			required: true,
			defaultValue: 'QRCode',
			options: { disabled: false, options: BARCODE_TYPES },
		}),
		decorationImage: Property.ShortText({
			displayName: 'Logo URL',
			description: 'QR codes only: public link to a small logo placed in the middle.',
			required: false,
		}),
		...pdfCoProps.output(),
	},
	async run({ auth, propsValue, files }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		if (propsValue.value.trim() === '') {
			throw new Error('Value is required.');
		}
		if (!BARCODE_TYPES.some((option) => option.value === propsValue.type)) {
			throw new Error('Pick a barcode type from the list.');
		}
		const logo = pdfCoFiles.nonEmptyString(propsValue.decorationImage);
		if (logo !== undefined) {
			pdfCoFiles.validateSource({ url: logo, file: undefined, label: 'Logo' });
		}
		return pdfCoJobs.runFileAction({
			apiKey,
			files,
			path: '/v1/barcode/generate',
			body: {
				value: propsValue.value,
				type: propsValue.type,
				inline: false,
				...(logo === undefined ? {} : { decorationImage: logo.trim() }),
			},
			common: propsValue,
		});
	},
});
