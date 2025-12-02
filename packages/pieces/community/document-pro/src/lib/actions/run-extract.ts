import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { documentProAuth } from '../common/auth';

export const runExtract = createAction({
	auth: documentProAuth,
	name: 'run_extract',
	displayName: 'Run Extract',
	description: 'Run an extract on a document using a workflow. Returns a request ID to check parsing status.',
	props: {
		documentId: Property.ShortText({
			displayName: 'Document ID',
			description: 'The unique identifier of the document to parse',
			required: true,
		}),
		templateId: Property.ShortText({
			displayName: 'Workflow ID',
			description: 'The unique identifier of the workflow (template) to use for parsing',
			required: true,
		}),
		useOcr: Property.Checkbox({
			displayName: 'Use OCR',
			description:
				'Required if using gpt-3.5-turbo or any OCR-related features (layout detection, table detection, regex segmentation)',
			required: false,
		}),
		queryModel: Property.StaticDropdown({
			displayName: 'Query Model',
			description: 'AI model to use for parsing',
			required: false,
			options: {
				options: [
					{ label: 'GPT-4o', value: 'gpt-4o' },
					{ label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
					{ label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
				],
			},
		}),
		detectLayout: Property.Checkbox({
			displayName: 'Detect Layout',
			description: 'Detect document layout. Requires Use OCR to be enabled.',
			required: false,
		}),
		detectTables: Property.Checkbox({
			displayName: 'Detect Tables',
			description: 'Detect tables in the document. Requires Use OCR to be enabled.',
			required: false,
		}),
		pageRanges: Property.ShortText({
			displayName: 'Page Ranges',
			description: 'Pages to parse (e.g., "1-3,5,7-9"). Does not apply to image files.',
			required: false,
		}),
		chunkByPages: Property.Number({
			displayName: 'Chunk by Pages',
			description: 'Number of pages per segment for segmentation method 1',
			required: false,
		}),
		rollingWindow: Property.Number({
			displayName: 'Rolling Window',
			description: 'Window size for segmentation method 2',
			required: false,
		}),
		startRegex: Property.ShortText({
			displayName: 'Start Regex',
			description: 'Regex pattern to define where parsing begins (method 3). Requires Use OCR.',
			required: false,
		}),
		endRegex: Property.ShortText({
			displayName: 'End Regex',
			description: 'Regex pattern to define where parsing ends (method 3). Requires Use OCR.',
			required: false,
		}),
		splitRegex: Property.ShortText({
			displayName: 'Split Regex',
			description: 'Regex pattern to split document into sections (method 4). Requires Use OCR.',
			required: false,
		}),
		useAllMatches: Property.Checkbox({
			displayName: 'Use All Matches',
			description: 'Use all regex matches instead of just the first (methods 3 and 4). Requires Use OCR.',
			required: false,
		}),
	},
	async run(context) {
		const {
			documentId,
			templateId,
			useOcr,
			queryModel,
			detectLayout,
			detectTables,
			pageRanges,
			chunkByPages,
			rollingWindow,
			startRegex,
			endRegex,
			splitRegex,
			useAllMatches,
		} = context.propsValue;

		const queryParams: Record<string, string> = {
			template_id: templateId,
		};

		if (useOcr === true) {
			queryParams['use_ocr'] = 'true';
		}

		if (queryModel) {
			queryParams['query_model'] = queryModel;
		}

		if (detectLayout === true) {
			queryParams['detect_layout'] = 'true';
		}

		if (detectTables === true) {
			queryParams['detect_tables'] = 'true';
		}

		if (pageRanges) {
			queryParams['page_ranges'] = pageRanges;
		}

		if (chunkByPages !== undefined) {
			queryParams['chunk_by_pages'] = chunkByPages.toString();
		}

		if (rollingWindow !== undefined) {
			queryParams['rolling_window'] = rollingWindow.toString();
		}

		if (startRegex) {
			queryParams['start_regex'] = startRegex;
		}

		if (endRegex) {
			queryParams['end_regex'] = endRegex;
		}

		if (splitRegex) {
			queryParams['split_regex'] = splitRegex;
		}

		if (useAllMatches === true) {
			queryParams['use_all_matches'] = 'true';
		}

		const response = await httpClient.sendRequest({
			method: HttpMethod.GET,
			url: `https://api.documentpro.ai/v1/documents/${documentId}/run_parser`,
			headers: {
				'x-api-key': context.auth,
				Accept: 'application/json',
			},
			queryParams,
		});

		return response.body;
	},
});

