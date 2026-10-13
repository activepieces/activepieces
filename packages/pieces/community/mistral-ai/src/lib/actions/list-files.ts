import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { mistralAuth } from '../common/auth';
import { mistralApi } from '../common/client';
import { FILE_PURPOSE_OPTIONS, fileUtils, MistralFile } from '../common/files';
import { listFilesOutputSchema } from '../output-schemas';

export const listFiles = createAction({
	auth: mistralAuth,
	name: 'list_files',
	classification: 'SEARCH',
	displayName: 'List Files',
	description: 'List files uploaded to your Mistral account.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Lists files stored in the Mistral account with their UUIDs, names, purpose, size and creation time, optionally filtered by purpose or a filename search, one page at a time. Use it to find a file id for Get File, Delete File, Download File, OCR, transcription or a batch job. Read-only; safe to retry.',
		idempotent: true,
	},
	outputSchema: listFilesOutputSchema,
	props: {
		purpose: Property.StaticDropdown({
			displayName: 'Purpose',
			description: 'Only return files uploaded for this purpose.',
			required: false,
			options: { options: FILE_PURPOSE_OPTIONS },
		}),
		search: Property.ShortText({
			displayName: 'Search',
			description: 'Only return files whose name contains this text.',
			required: false,
		}),
		page: Property.Number({
			displayName: 'Page',
			description: 'Zero-based page number.',
			required: false,
			defaultValue: 0,
		}),
		page_size: Property.Number({
			displayName: 'Page Size',
			required: false,
			defaultValue: 100,
		}),
	},
	async run(context) {
		const { purpose, search, page, page_size } = context.propsValue;
		const response = await mistralApi.call<{ data: MistralFile[]; total?: number | null }>({
			auth: context.auth,
			method: HttpMethod.GET,
			path: '/files',
			queryParams: { purpose, search, page, page_size, include_total: true },
		});
		const files = response.data.map(fileUtils.formatFile);
		return {
			files,
			count: files.length,
			total: response.total ?? null,
		};
	},
});
