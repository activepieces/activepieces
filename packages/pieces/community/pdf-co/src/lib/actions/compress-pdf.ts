import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const compressPdf = createAction({
	auth: pdfCoAuth,
	name: 'compress_pdf',
	displayName: 'Compress PDF',
	description: 'Reduce the file size of a PDF.',
	audience: 'both',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Reduces the file size of a PDF (public URL or file) using a compression preset (low, medium, high or aggressive) and an optional image quality, returning the smaller copy. Use before emailing or archiving large PDFs. Costs 35 credits per page. Not idempotent: each call runs a new job and creates a new output.',
		idempotent: false,
	},
	outputSchema: pdfCoOutputSchemas.fileResult,
	props: {
		sourceUrl: pdfCoProps.sourceUrl(),
		sourceFile: pdfCoProps.sourceFile(),
		compressionLevel: Property.StaticDropdown({
			displayName: 'Compression Level',
			description: 'Stronger levels make smaller files with lower image quality.',
			required: false,
			defaultValue: 'medium',
			options: {
				disabled: false,
				options: [
					{ label: 'Low (best quality)', value: 'low' },
					{ label: 'Medium (default)', value: 'medium' },
					{ label: 'High', value: 'high' },
					{ label: 'Aggressive (smallest file)', value: 'aggressive' },
				],
			},
		}),
		colorQuality: Property.Number({
			displayName: 'Image Quality (1-100)',
			description: 'JPEG quality for color and grayscale images. Lower is smaller. Leave empty for the preset default.',
			required: false,
		}),
		...pdfCoProps.password(),
		...pdfCoProps.output(),
	},
	async run({ auth, propsValue, files }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const quality = propsValue.colorQuality;
		if (quality !== undefined && quality !== null && (!Number.isInteger(Number(quality)) || Number(quality) < 1 || Number(quality) > 100)) {
			throw new Error('Image Quality must be a whole number from 1 to 100.');
		}
		const level = pdfCoFiles.nonEmptyString(propsValue.compressionLevel);
		const url = await pdfCoFiles.resolveSource({ apiKey, url: propsValue.sourceUrl, file: propsValue.sourceFile });
		return pdfCoJobs.runFileAction({
			apiKey,
			files,
			path: '/v2/pdf/compress',
			body: {
				url,
				...(level === undefined ? {} : { compressionLevel: level }),
				...(quality === undefined || quality === null ? {} : { colorQuality: Number(quality) }),
			},
			common: propsValue,
		});
	},
});
