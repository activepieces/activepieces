import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { airparserAuth } from '../../auth';
import {
	airparserClient,
	airparserOutputSchemas,
	buildUploadForm,
	parseJsonObjectInput,
	pathFor,
	requireId,
	SYNC_UPLOAD_TIMEOUT_MS,
	toSyncResult,
} from '../../common';

export const parseDocumentSyncAiAction = createAction({
	auth: airparserAuth,
	name: 'parse_document_sync',
	classification: 'WRITE',
	displayName: 'Parse Document',
	description: 'Upload a file and wait for its parsed data. Uses credits.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Uploads a file to an Airparser inbox, which creates a new document and uses Airparser credits, then waits up to about 60 seconds for the parsed JSON. If parsing takes longer, parsing_in_progress is true and only doc_id is set: do not upload again, call Get Document with that doc_id later. Not idempotent: every call creates and bills a new document. ZIP files are not supported.',
		idempotent: false,
	},
	outputSchema: airparserOutputSchemas.sync,
	props: {
		inboxId: Property.ShortText({ displayName: 'Inbox ID', description: 'The inbox ID, from List Inboxes.', required: true }),
		file: Property.File({ displayName: 'File', description: 'The document to parse, up to 20 MB.', required: true }),
		fileName: Property.ShortText({ displayName: 'File Name', description: 'Keep the extension (e.g. invoice.pdf). Defaults to the file name.', required: false }),
		meta: Property.LongText({
			displayName: 'Metadata JSON',
			description: 'Optional JSON object returned with the result under __meta__.',
			required: false,
		}),
	},
	async run(context) {
		const { file, fileName, meta } = context.propsValue;
		const inboxId = requireId({ value: context.propsValue.inboxId, label: 'Inbox ID' });
		const response = await airparserClient.call({
			apiKey: context.auth.secret_text,
			method: HttpMethod.POST,
			path: `/inboxes${pathFor([inboxId])}/upload-sync`,
			operation: 'parse document',
			body: buildUploadForm({ file, fileName, meta: parseJsonObjectInput({ value: meta, label: 'Metadata JSON' }) }),
			timeoutMs: SYNC_UPLOAD_TIMEOUT_MS,
		});
		return toSyncResult(response);
	},
});
