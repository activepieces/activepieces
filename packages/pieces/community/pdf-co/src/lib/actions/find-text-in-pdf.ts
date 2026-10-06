import { createAction, Property } from '@activepieces/pieces-framework';
import { pdfCoAuth } from '../auth';
import { pdfCoClient } from '../common/client';
import { pdfCoFiles } from '../common/files';
import { pdfCoJobs } from '../common/jobs';
import { pdfCoProps } from '../common/props';
import { pdfCoOutputSchemas } from '../output-schemas';

const MODES = ['SmartMatch', 'ExactMatch', 'None'];

export const findTextInPdf = createAction({
	auth: pdfCoAuth,
	name: 'find_text_in_pdf',
	displayName: 'Find Text in PDF',
	description: 'Find every place a word, phrase or pattern appears in a PDF.',
	audience: 'both',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Finds every occurrence of a text or regular expression in a PDF (public URL or file) and returns each match\'s text, page (0-based) and coordinates. Use to locate where to stamp text or images, or to check a document contains a phrase. Costs 35 credits per page. Read-only and idempotent.',
		idempotent: true,
	},
	outputSchema: pdfCoOutputSchemas.findText,
	props: {
		sourceUrl: pdfCoProps.sourceUrl(),
		sourceFile: pdfCoProps.sourceFile(),
		searchString: Property.ShortText({
			displayName: 'Text to Find',
			description: 'The word or phrase to look for, or a regular expression when "Use Regular Expression" is on.',
			required: true,
		}),
		regexSearch: Property.Checkbox({
			displayName: 'Use Regular Expression',
			required: false,
			defaultValue: false,
		}),
		wordMatchingMode: Property.StaticDropdown({
			displayName: 'Word Matching',
			description: 'Smart Match (default) matches whole words flexibly; Exact Match needs the exact word; None matches any part of the text.',
			required: false,
			defaultValue: 'SmartMatch',
			options: {
				disabled: false,
				options: [
					{ label: 'Smart Match (default)', value: 'SmartMatch' },
					{ label: 'Exact Match', value: 'ExactMatch' },
					{ label: 'None (substring)', value: 'None' },
				],
			},
		}),
		pages: pdfCoProps.pages({ base: 0 }),
		...pdfCoProps.inlineRead(),
	},
	async run({ auth, propsValue }) {
		const apiKey = pdfCoClient.apiKeyOf(auth);
		const searchString = propsValue.searchString;
		if (searchString.trim() === '') {
			throw new Error('Text to Find is required.');
		}
		const mode = pdfCoFiles.nonEmptyString(propsValue.wordMatchingMode);
		if (mode !== undefined && !MODES.includes(mode)) {
			throw new Error(`Word Matching must be one of ${MODES.join(', ')}.`);
		}
		const pages = pdfCoFiles.nonEmptyString(propsValue.pages);
		const url = await pdfCoFiles.resolveSource({ apiKey, url: propsValue.sourceUrl, file: propsValue.sourceFile });
		const body = await pdfCoJobs.runInline({
			apiKey,
			path: '/v1/pdf/find',
			body: {
				url,
				searchString,
				regexSearch: propsValue.regexSearch === true,
				inline: true,
				...(mode === undefined ? {} : { wordMatchingMode: mode }),
				...(pages === undefined ? {} : { pages: pages.trim() }),
			},
			common: propsValue,
		});
		const raw = body['body'];
		const matches = (Array.isArray(raw) ? raw : []).map((item) => {
			const match = pdfCoClient.readRecord(item);
			return {
				text: match['text'],
				page_index: match['pageIndex'],
				left: match['left'],
				top: match['top'],
				width: match['width'],
				height: match['height'],
			};
		});
		return {
			match_count: matches.length,
			matches,
			page_count: body['pageCount'],
			credits_used: body['credits'],
			remaining_credits: body['remainingCredits'],
		};
	},
});
