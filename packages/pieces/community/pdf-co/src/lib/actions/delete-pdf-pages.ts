import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const deletePdfPages = createAction({
	auth: pdfCoAuth,
	name: 'delete_pdf_pages',
	displayName: 'Delete Pages from PDF',
	description: 'Create a copy of a PDF without the pages you list.',
	audience: 'both',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a new PDF from a source PDF (public URL or file) with the listed pages removed; the source file is not changed. Page numbers start at 1 here (e.g. "1,3-4"). Costs 5 credits per page. Not idempotent: each call runs a new job and creates a new output.',
		idempotent: false,
	},
	outputSchema: pdfCoOutputSchemas.fileResult,
	props: {
		sourceUrl: pdfCoProps.sourceUrl(),
		sourceFile: pdfCoProps.sourceFile(),
		pages: Property.ShortText({
			displayName: 'Pages to Delete',
			description: 'Pages to remove, comma-separated. The first page is 1 (not 0). Example: "1,3-4" or "5-" for page 5 to the end.',
			required: true,
		}),
		...pdfCoProps.httpAuth(),
		...pdfCoProps.output(),
	},
	async run({ auth, propsValue, files }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const pages = propsValue.pages.trim();
		if (pages === '') {
			throw new Error('Pages is required, e.g. "1,3-4".');
		}
		const url = await pdfCoFiles.resolveSource({ apiKey, url: propsValue.sourceUrl, file: propsValue.sourceFile });
		return pdfCoJobs.runFileAction({
			apiKey,
			files,
			path: '/v1/pdf/edit/delete-pages',
			body: { url, pages },
			common: propsValue,
		});
	},
});
