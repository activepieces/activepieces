import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartsuiteAuth } from '../auth';
import { SmartSuiteRecord } from '../common';
import { smartSuiteClient, SmartSuiteCredentials } from '../common/client';
import { smartSuiteInputs } from '../common/inputs';
import { smartsuiteCommon } from '../common/props';
import { outputSchemas } from '../output-schemas';

const MAX_FILES = 50;

async function fileUrl({ credentials, handle }: { credentials: SmartSuiteCredentials; handle: string }): Promise<string> {
	const response = await smartSuiteClient.request<unknown>({
		credentials,
		method: HttpMethod.GET,
		path: `/shared-files/${smartSuiteClient.pathSegment({ value: handle, label: 'File Handle' })}/url/`,
		operation: 'get file URL',
	});
	const url = typeof response === 'string' ? response : smartSuiteInputs.isPlainObject(response) ? response['url'] : undefined;
	if (typeof url !== 'string' || url.length === 0) {
		throw new Error(`SmartSuite returned no download URL for file handle ${handle}.`);
	}
	return url;
}

function fileName(file: Record<string, unknown>): string | null {
	const metadata = file['metadata'];
	const name = smartSuiteInputs.isPlainObject(metadata) ? metadata['filename'] : undefined;
	return typeof name === 'string' ? name : null;
}

export const getFileUrl = createAction({
	name: 'download_record_file',
	classification: 'READ',
	displayName: 'Get File Download URLs',
	description: 'Gets temporary download links for the files in a record\'s Files & Images field.',
	audience: 'human',
	aiMetadata: {
		description: 'Builder version that picks the record and Files & Images field; agents should use Get File Download URL (by Handle). Returns a temporary URL for each file in the field (up to 50). Files are not downloaded. Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		solutionId: smartsuiteCommon.solutionId,
		tableId: smartsuiteCommon.tableId,
		recordId: smartsuiteCommon.recordDropdown({ displayName: 'Record' }),
		field: smartsuiteCommon.tableFieldDropdown({
			displayName: 'File Field',
			description: 'The Files & Images field to read.',
			required: true,
			onlyTypes: ['filefield'],
		}),
	},
	outputSchema: outputSchemas['recordFileUrls'],
	async run({ auth, propsValue }) {
		const credentials = smartSuiteClient.credentialsOf(auth);
		const field = smartSuiteInputs.requireText({ value: propsValue.field, label: 'File Field' });
		const record = await smartSuiteClient.request<SmartSuiteRecord>({
			credentials,
			method: HttpMethod.GET,
			path: `/applications/${smartSuiteClient.pathSegment({ value: propsValue.tableId, label: 'Table' })}/records/${smartSuiteClient.pathSegment({ value: propsValue.recordId, label: 'Record' })}/`,
			operation: 'get record',
		});
		const stored = record[field];
		const entries = (Array.isArray(stored) ? stored : []).filter(smartSuiteInputs.isPlainObject).filter((file) => typeof file['handle'] === 'string');
		if (entries.length > MAX_FILES) {
			throw new Error(`The field holds ${entries.length} files; this action returns at most ${MAX_FILES}. Use Get File Download URL (by Handle) per file.`);
		}
		const files = [];
		for (const file of entries) {
			const handle = String(file['handle']);
			files.push({ handle, name: fileName(file), url: await fileUrl({ credentials, handle }) });
		}
		return { recordId: String(propsValue.recordId), field, files, count: files.length };
	},
});

export const getFileUrlByHandle = createAction({
	name: 'download_record_file_by_handle',
	classification: 'READ',
	displayName: 'Get File Download URL (by Handle)',
	description: 'Gets a temporary download link for one file, by its file handle.',
	audience: 'ai',
	aiMetadata: {
		description: 'Returns a temporary download URL for one SmartSuite file, given its file handle (the "handle" value inside a Files & Images field of a record from Get Record (by ID) or List Records). The file itself is not downloaded; the URL expires, so use it soon. Read-only and idempotent.',
		idempotent: true,
	},
	auth: smartsuiteAuth,
	props: {
		fileHandle: Property.ShortText({
			displayName: 'File Handle',
			description: 'The "handle" of the file, found in the record\'s Files & Images field.',
			required: true,
		}),
	},
	outputSchema: outputSchemas['fileUrl'],
	async run({ auth, propsValue }) {
		const handle = smartSuiteInputs.requireText({ value: propsValue.fileHandle, label: 'File Handle' });
		return { handle, url: await fileUrl({ credentials: smartSuiteClient.credentialsOf(auth), handle }) };
	},
});
