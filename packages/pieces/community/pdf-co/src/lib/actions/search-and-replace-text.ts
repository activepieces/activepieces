import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoJobs } from '../common/jobs';
import { commonProps, PDF_CO_DEFAULTS, pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

export const searchAndReplaceText = createAction({
	name: 'search_and_replace_text',
	classification: 'WRITE',
	displayName: 'Search and Replace Text in PDF',
	description: 'Search for specific text or patterns in a PDF and replace it with new text.',
	audience: 'both',
	aiMetadata: {
		description:
			'Finds occurrences of given texts in a source PDF (referenced by URL) and replaces each with the replacement at the same position in the list, with optional case-sensitive matching or regular-expression patterns; both lists must have the same length and page indexes start at 0. Use when an agent needs to edit textual content in an existing document. Each call produces a new output PDF file and consumes credits, so it is not idempotent.',
		idempotent: false,
	},
	auth: pdfCoAuth,
	outputSchema: pdfCoOutputSchemas.rawResult,
	props: {
		url: Property.ShortText({
			displayName: 'PDF URL',
			description: 'URL to the source PDF file.',
			required: true,
		}),
		searchStrings: Property.Array({
			displayName: 'Text to Locate',
			description: 'Texts to find. Each one is replaced by the Replacement Text in the same position.',
			required: true,
		}),
		replaceStrings: Property.Array({
			displayName: 'Replacement Text',
			description: 'One replacement per Text to Locate, in the same order.',
			required: true,
		}),
		caseSensitive: Property.Checkbox({
			displayName: 'Case Sensitive',
			description: 'Set to true for case-sensitive search, false otherwise.',
			required: false,
			defaultValue: true,
		}),
		regex: Property.Checkbox({
			displayName: 'Use Regular Expressions ?',
			description: 'Set to true to use regular expressions for search texts.',
			required: false,
			defaultValue: false,
		}),
		pages: Property.ShortText({
			displayName: 'Pages',
			description: 'Comma-separated page indexes or ranges (first page is 0), e.g. "0,2,5-10". Leave empty for all pages.',
			required: false,
		}),
		...commonProps,
		replacementLimit: Property.Number({
			displayName: 'Max Replacements per Text',
			description: 'Maximum replacements for each text. Leave empty or 0 to replace every match.',
			required: false,
		}),
		saveOutputFile: pdfCoProps.saveOutputFile({ defaultValue: PDF_CO_DEFAULTS.saveOutputFileOnExistingActions }),
	},
	async run({ auth, propsValue, files }) {
		const searchStrings = toStringList(propsValue.searchStrings);
		const replaceStrings = toStringList(propsValue.replaceStrings);
		if (searchStrings.length === 0) {
			throw new Error('Add at least one Text to Locate.');
		}
		if (searchStrings.some((item) => item === '')) {
			throw new Error('Text to Locate cannot contain empty entries.');
		}
		if (searchStrings.length !== replaceStrings.length) {
			throw new Error(
				`Text to Locate has ${searchStrings.length} entries but Replacement Text has ${replaceStrings.length}. Give one replacement per text, in the same order.`,
			);
		}
		const limit = propsValue.replacementLimit;
		if (limit !== undefined && limit !== null && (!Number.isInteger(Number(limit)) || Number(limit) < 0)) {
			throw new Error('Max Replacements per Text must be a whole number of 0 or more.');
		}
		const body = pdfCoClient.readRecord(
			await pdfCoClient.request<unknown>({
				apiKey: pdfCoClient.apiKeyOf(auth),
				method: HttpMethod.POST,
				path: '/v1/pdf/edit/replace-text',
				body: {
					url: propsValue.url,
					searchStrings,
					replaceStrings,
					async: false,
					caseSensitive: propsValue.caseSensitive,
					regex: propsValue.regex,
					pages: propsValue.pages,
					name: propsValue.fileName,
					expiration: propsValue.expiration,
					httppassword: propsValue.httpPassword,
					httpusername: propsValue.httpUsername,
					password: propsValue.pdfPassword,
					...(limit === undefined || limit === null ? {} : { replacementLimit: Number(limit) }),
				},
			}),
		);
		const saved = await pdfCoJobs.optionalSave({ files, url: body['url'], enabled: propsValue.saveOutputFile, fileName: propsValue.fileName });
		return { ...body, ...saved };
	},
});

function toStringList(value: unknown): string[] {
	if (!Array.isArray(value)) {
		return [];
	}
	return value.map((item) => (item === undefined || item === null ? '' : String(item)));
}
