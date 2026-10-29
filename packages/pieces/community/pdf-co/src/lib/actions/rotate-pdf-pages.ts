import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const rotatePdfPages = createAction({
	auth: pdfCoAuth,
	name: 'rotate_pdf_pages',
	displayName: 'Rotate PDF Pages',
	description: 'Rotate all or some pages of a PDF by 90, 180 or 270 degrees.',
	audience: 'both',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Rotates the selected pages of a PDF (public URL or file) clockwise by 90, 180 or 270 degrees into a new PDF; leave pages empty to rotate every page. Page numbers start at 0 here. Costs 7 credits per page. Not idempotent: each call runs a new job and creates a new output.',
		idempotent: false,
	},
	outputSchema: pdfCoOutputSchemas.fileResult,
	props: {
		sourceUrl: pdfCoProps.sourceUrl(),
		sourceFile: pdfCoProps.sourceFile(),
		angle: Property.StaticDropdown({
			displayName: 'Angle',
			description: 'How far to rotate the pages clockwise.',
			required: true,
			defaultValue: '90',
			options: {
				disabled: false,
				options: [
					{ label: '90 degrees', value: '90' },
					{ label: '180 degrees', value: '180' },
					{ label: '270 degrees', value: '270' },
				],
			},
		}),
		pages: pdfCoProps.pages({ base: 0 }),
		...pdfCoProps.httpAuth(),
		...pdfCoProps.output(),
	},
	async run({ auth, propsValue, files }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const angle = Number(propsValue.angle);
		if (![90, 180, 270].includes(angle)) {
			throw new Error('Angle must be 90, 180 or 270.');
		}
		const url = await pdfCoFiles.resolveSource({ apiKey, url: propsValue.sourceUrl, file: propsValue.sourceFile });
		const pages = pdfCoFiles.nonEmptyString(propsValue.pages);
		return pdfCoJobs.runFileAction({
			apiKey,
			files,
			path: '/v1/pdf/edit/rotate',
			body: { url, angle, ...(pages === undefined ? {} : { pages: pages.trim() }) },
			common: propsValue,
		});
	},
});
