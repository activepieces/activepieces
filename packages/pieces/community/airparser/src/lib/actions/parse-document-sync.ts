import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airparserAuth } from '../auth';
import {
	airparserClient,
	airparserOutputSchemas,
	buildUploadForm,
	parseJsonObjectInput,
	pathFor,
	requireId,
	SYNC_UPLOAD_TIMEOUT_MS,
	toSyncResult,
} from '../common';
import { inboxIdDropdown } from '../common/props';

export const extractDataWaitAction = createAction({
	auth: airparserAuth,
	name: 'extract_data_wait',
	classification: 'WRITE',
	displayName: 'Extract Data (Wait for Result)',
	description: 'Upload a file and wait up to about 60 seconds for the parsed data. Uses Airparser credits.',
	audience: 'human',
	aiMetadata: { idempotent: false },
	outputSchema: airparserOutputSchemas.sync,
	props: {
		inboxId: inboxIdDropdown,
		file: Property.File({
			displayName: 'File',
			description: 'The document to parse: PDF, EML, HTML, TXT, DOCX, XLSX, CSV or image, up to 20 MB. ZIP is not supported here.',
			required: true,
		}),
		fileName: Property.ShortText({
			displayName: 'File Name',
			description: 'Keep the extension (e.g. invoice.pdf). Defaults to the name of the file; a missing extension is copied from the file.',
			required: false,
		}),
		meta: Property.Object({
			displayName: 'Metadata',
			description: 'Optional key-value data (e.g. an order ID) that comes back with the parsed result.',
			required: false,
		}),
		markdown: Property.MarkDown({
			value: 'If parsing takes longer than about 60 seconds, Still Parsing is true and only the document ID is returned. Use Get Data from Document later to read the result.',
		}),
	},
	async run(context) {
		const { inboxId, file, meta, fileName } = context.propsValue;
		const response = await airparserClient.call({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			path: `/inboxes${pathFor([requireId({ value: inboxId, label: 'Inbox' })])}/upload-sync`,
			operation: 'parse (wait for result)',
			body: buildUploadForm({ file, fileName, meta: parseJsonObjectInput({ value: meta, label: 'Metadata' }) }),
			timeoutMs: SYNC_UPLOAD_TIMEOUT_MS,
		});
		return toSyncResult(response);
	},
});
