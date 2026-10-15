import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const makePdfSearchable = createAction({
	auth: pdfCoAuth,
	name: 'make_pdf_searchable',
	displayName: 'Make PDF Searchable (OCR)',
	description: 'Run OCR on a scanned PDF so its text can be selected and searched.',
	audience: 'both',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Runs OCR on a scanned PDF or image (public URL or file) and returns a copy with a selectable, searchable text layer. Use before text extraction on scans when Extract Text with OCR is not enough; pages start at 0. Costs 35 credits per page. Not idempotent: each call runs a new job and creates a new output.',
		idempotent: false,
	},
	outputSchema: pdfCoOutputSchemas.fileResult,
	props: {
		sourceUrl: pdfCoProps.sourceUrl(),
		sourceFile: pdfCoProps.sourceFile(),
		lang: Property.ShortText({
			displayName: 'OCR Language',
			description: 'Language of the text, e.g. "eng", "deu", or "eng+deu" for several. Default "eng".',
			required: false,
		}),
		pages: pdfCoProps.pages({ base: 0 }),
		...pdfCoProps.password(),
		...pdfCoProps.httpAuth(),
		...pdfCoProps.output(),
	},
	async run({ auth, propsValue, files }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const lang = pdfCoFiles.nonEmptyString(propsValue.lang);
		const pages = pdfCoFiles.nonEmptyString(propsValue.pages);
		const url = await pdfCoFiles.resolveSource({ apiKey, url: propsValue.sourceUrl, file: propsValue.sourceFile });
		return pdfCoJobs.runFileAction({
			apiKey,
			files,
			path: '/v1/pdf/makesearchable',
			body: {
				url,
				...(lang === undefined ? {} : { lang: lang.trim() }),
				...(pages === undefined ? {} : { pages: pages.trim() }),
			},
			common: propsValue,
		});
	},
});
