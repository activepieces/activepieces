import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

const FORMATS = ['jpg', 'png', 'webp', 'tiff'];

export const convertPdfToImage = createAction({
	auth: pdfCoAuth,
	name: 'convert_pdf_to_image',
	displayName: 'Convert PDF to Images',
	description: 'Render PDF pages as JPG, PNG, WEBP or TIFF images.',
	audience: 'both',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Renders the pages of a PDF (public URL or file) to JPG, PNG or WEBP images (one image per page) or one multi-page TIFF, returning a temporary link per image and optionally saving the files. Use for previews and thumbnails; pages start at 0. Costs 12 (JPG), 15 (PNG), 18 (WEBP) or 28 (TIFF) credits per page. Not idempotent: each call runs a new job and creates new outputs.',
		idempotent: false,
	},
	outputSchema: pdfCoOutputSchemas.multiFileResult,
	props: {
		sourceUrl: pdfCoProps.sourceUrl(),
		sourceFile: pdfCoProps.sourceFile(),
		format: Property.StaticDropdown({
			displayName: 'Image Format',
			required: true,
			defaultValue: 'png',
			options: {
				disabled: false,
				options: [
					{ label: 'JPG', value: 'jpg' },
					{ label: 'PNG', value: 'png' },
					{ label: 'WEBP', value: 'webp' },
					{ label: 'TIFF (one multi-page file)', value: 'tiff' },
				],
			},
		}),
		pages: pdfCoProps.pages({ base: 0 }),
		...pdfCoProps.password(),
		...pdfCoProps.httpAuth(),
		...pdfCoProps.output(),
	},
	async run({ auth, propsValue, files }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const format = propsValue.format;
		if (!FORMATS.includes(format)) {
			throw new Error(`Image Format must be one of ${FORMATS.join(', ')}.`);
		}
		const pages = pdfCoFiles.nonEmptyString(propsValue.pages);
		const url = await pdfCoFiles.resolveSource({ apiKey, url: propsValue.sourceUrl, file: propsValue.sourceFile });
		return pdfCoJobs.runFileAction({
			apiKey,
			files,
			path: `/v1/pdf/convert/to/${format}`,
			body: { url, ...(pages === undefined ? {} : { pages: pages.trim() }) },
			common: propsValue,
			multiOutput: true,
		});
	},
});
