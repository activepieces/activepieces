import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const deleteTextFromPdf = createAction({
	auth: pdfCoAuth,
	name: 'delete_text_from_pdf',
	displayName: 'Delete (Redact) Text in PDF',
	description: 'Create a copy of a PDF with the given words or patterns removed.',
	audience: 'both',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates a copy of a PDF (public URL or file) with every match of the given texts or regular expressions removed, e.g. to redact names or numbers; the source file is not changed. Pages start at 0. Costs 21 credits per page. Not idempotent: each call runs a new job and creates a new output.',
		idempotent: false,
	},
	outputSchema: pdfCoOutputSchemas.fileResult,
	props: {
		sourceUrl: pdfCoProps.sourceUrl(),
		sourceFile: pdfCoProps.sourceFile(),
		searchStrings: Property.Array({
			displayName: 'Text to Remove',
			description: 'Words, phrases or (with Regular Expressions on) patterns to delete.',
			required: true,
		}),
		caseSensitive: Property.Checkbox({ displayName: 'Case Sensitive', required: false, defaultValue: true }),
		regex: Property.Checkbox({ displayName: 'Use Regular Expressions', required: false, defaultValue: false }),
		replacementLimit: Property.Number({
			displayName: 'Max Matches per Text',
			description: 'Maximum matches to remove for each text. Leave empty or 0 to remove every match.',
			required: false,
		}),
		pages: pdfCoProps.pages({ base: 0 }),
		...pdfCoProps.password(),
		...pdfCoProps.httpAuth(),
		...pdfCoProps.output(),
	},
	async run({ auth, propsValue, files }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const searchStrings = (Array.isArray(propsValue.searchStrings) ? propsValue.searchStrings : [])
			.map((item) => String(item ?? ''))
			.filter((item) => item !== '');
		if (searchStrings.length === 0) {
			throw new Error('Add at least one text to remove.');
		}
		const limit = propsValue.replacementLimit;
		if (limit !== undefined && limit !== null && (!Number.isInteger(Number(limit)) || Number(limit) < 0)) {
			throw new Error('Max Matches per Text must be a whole number of 0 or more.');
		}
		const pages = pdfCoFiles.nonEmptyString(propsValue.pages);
		const url = await pdfCoFiles.resolveSource({ apiKey, url: propsValue.sourceUrl, file: propsValue.sourceFile });
		return pdfCoJobs.runFileAction({
			apiKey,
			files,
			path: '/v1/pdf/edit/delete-text',
			body: {
				url,
				searchStrings,
				caseSensitive: propsValue.caseSensitive !== false,
				regex: propsValue.regex === true,
				...(limit === undefined || limit === null ? {} : { replacementLimit: Number(limit) }),
				...(pages === undefined ? {} : { pages: pages.trim() }),
			},
			common: propsValue,
		});
	},
});
