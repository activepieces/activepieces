import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const splitPdf = createAction({
	auth: pdfCoAuth,
	name: 'split_pdf',
	displayName: 'Split PDF',
	description: 'Split a PDF into several PDFs by page ranges.',
	audience: 'both',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Splits a PDF (public URL or file) into several PDFs by page ranges and returns one temporary link per part, optionally saving each part as a file. Page numbers start at 1 here (e.g. "1-2,3-"); "*" makes one file per page. Costs 2 credits per page. Not idempotent: each call runs a new job and creates new outputs.',
		idempotent: false,
	},
	outputSchema: pdfCoOutputSchemas.multiFileResult,
	props: {
		sourceUrl: pdfCoProps.sourceUrl(),
		sourceFile: pdfCoProps.sourceFile(),
		pages: Property.ShortText({
			displayName: 'Page Ranges',
			description:
				'Comma-separated ranges, one output file per range. The first page is 1 (not 0). Example: "1-2,3-" gives pages 1-2 and page 3 to the end. Use "*" for one file per page.',
			required: true,
			defaultValue: '*',
		}),
		...pdfCoProps.httpAuth(),
		...pdfCoProps.output(),
	},
	async run({ auth, propsValue, files }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const pages = propsValue.pages.trim();
		if (pages === '') {
			throw new Error('Page Ranges is required, e.g. "1-2,3-" or "*".');
		}
		const url = await pdfCoFiles.resolveSource({ apiKey, url: propsValue.sourceUrl, file: propsValue.sourceFile });
		return pdfCoJobs.runFileAction({
			apiKey,
			files,
			path: '/v1/pdf/split',
			body: { url, pages, inline: true },
			common: propsValue,
			multiOutput: true,
		});
	},
});
