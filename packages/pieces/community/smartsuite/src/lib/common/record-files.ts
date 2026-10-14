import { HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { SmartSuiteRecord } from '.';
import { smartSuiteClient, SmartSuiteCredentials } from './client';

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

async function attach({
	credentials,
	tableId,
	recordId,
	field,
	file,
}: {
	credentials: SmartSuiteCredentials;
	tableId: unknown;
	recordId: unknown;
	field: unknown;
	file: { base64: string; filename: string };
}): Promise<AttachResult> {
	const tableSegment = smartSuiteClient.pathSegment({ value: tableId, label: 'Table' });
	const recordSegment = smartSuiteClient.pathSegment({ value: recordId, label: 'Record ID' });
	const fieldSegment = smartSuiteClient.pathSegment({ value: field, label: 'File Field' });
	const data = Buffer.from(file.base64, 'base64');
	if (data.length === 0) {
		throw new Error('The file is empty.');
	}
	if (data.length > MAX_UPLOAD_BYTES) {
		throw new Error(`The file is ${data.length} bytes; the limit for this action is ${MAX_UPLOAD_BYTES} bytes (100 MB).`);
	}
	const formData = new FormData();
	formData.append('files', data, file.filename);
	await smartSuiteClient.request<unknown>({
		credentials,
		method: HttpMethod.POST,
		path: `/recordfiles/${tableSegment}/${recordSegment}/${fieldSegment}/`,
		body: formData,
		headers: formData.getHeaders(),
		operation: 'upload file',
	});
	const record = await smartSuiteClient.request<SmartSuiteRecord>({
		credentials,
		method: HttpMethod.GET,
		path: `/applications/${tableSegment}/records/${recordSegment}/`,
		operation: 'get record after upload',
	});
	const files = record[String(field)];
	return {
		recordId: String(recordId).trim(),
		field: String(field),
		fileName: file.filename,
		files: Array.isArray(files) ? files : [],
	};
}

export const recordFiles = { attach, MAX_UPLOAD_BYTES };

export type AttachResult = {
	recordId: string;
	field: string;
	fileName: string;
	files: unknown[];
};
