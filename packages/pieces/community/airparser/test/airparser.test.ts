import { HttpError, httpClient } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { airparserAuth } from '../src/lib/auth';
import { airparserTransport, buildUploadForm, buildUrl, docIdOf } from '../src/lib/common';
import { uploadDocumentAction } from '../src/lib/actions/upload-document-for-parsing';
import { extractDataFromDocumentAction } from '../src/lib/actions/extract-data-from-document';
import { listDocumentsAiAction } from '../src/lib/actions/ai/list-documents';
import { parseDocumentSyncAiAction } from '../src/lib/actions/ai/parse-document-sync';
import { getInboxAiAction } from '../src/lib/actions/ai/get-inbox';
import { upsertExtractionSchemaAiAction } from '../src/lib/actions/ai/upsert-extraction-schema';
import { documentParsedTrigger } from '../src/lib/triggers/document-parsed';
import { documentIdDropdown } from '../src/lib/common/props';
import { getDocumentAiAction } from '../src/lib/actions/ai/get-document';
import { listInboxesAiAction } from '../src/lib/actions/ai/list-inboxes';

const sendRequest = vi.spyOn(httpClient, 'sendRequest');

beforeEach(() => {
	vi.spyOn(airparserTransport, 'getDispatcher').mockResolvedValue({ verified: true });
});

afterEach(() => {
	sendRequest.mockReset();
});

function reply({ body, status = 200 }: { body: unknown; status?: number }) {
	return { status, headers: {}, body: typeof body === 'string' ? body : JSON.stringify(body) };
}

function lastRequest() {
	const call = sendRequest.mock.calls[sendRequest.mock.calls.length - 1];
	return { request: call[0], options: call[1] };
}

function runAction({ action, propsValue }: { action: { run: (ctx: never) => Promise<unknown> }; propsValue: Record<string, unknown> }) {
	const ctx = { auth: { secret_text: 'key-123' }, propsValue };
	return Reflect.apply(action.run, action, [ctx]);
}

describe('client', () => {
	it('builds repeated array keys by hand', () => {
		expect(buildUrl({ path: '/x', query: { status: ['parsed', 'fail'], page: 1, q: undefined } })).toBe(
			'https://api.airparser.com/x?status%5B%5D=parsed&status%5B%5D=fail&page=1',
		);
	});

	it('keeps a file extension on the upload name', () => {
		const data = Buffer.from('x');
		const nameOf = (form: FormData) => { const f = form.get('file'); return f instanceof File ? f.name : ''; };
		expect(nameOf(buildUploadForm({ file: { filename: 'a.pdf', data }, fileName: 'noext' }))).toBe('noext.pdf');
		expect(nameOf(buildUploadForm({ file: { filename: 'a', extension: 'txt', data }, fileName: 'noext' }))).toBe('noext.txt');
		expect(nameOf(buildUploadForm({ file: { filename: 'a.pdf', data }, fileName: 'b.png' }))).toBe('b.png');
		expect(nameOf(buildUploadForm({ file: { filename: 'a', data }, fileName: 'noext' }))).toBe('noext');
	});

	it('maps gpt_engine when llm_engine is missing', async () => {
		sendRequest.mockResolvedValueOnce(reply({ body: { _id: 'in1', gpt_engine: 'vision', gpt_model: 'g' } }));
		const out = await runAction({ action: getInboxAiAction, propsValue: { inboxId: 'in1' } });
		expect(out).toMatchObject({ llm_engine: 'vision', model: 'g' });
	});

	it('normalises the upload doc id', () => {
		expect(docIdOf('"abc"')).toBe('abc');
		expect(docIdOf({ doc_id: 'x1' })).toBe('x1');
		expect(() => docIdOf({})).toThrow('no document ID');
	});
});

describe('auth', () => {
	it('shows the vendor status and message', async () => {
		sendRequest.mockRejectedValueOnce(new HttpError('[redacted]', { status: 401, responseBody: '{"message":"Invalid token"}' }));
		const result = await airparserAuth.validate?.({ auth: 'bad', server: { apiUrl: '', publicUrl: '' } });
		expect(result).toEqual({ valid: false, error: expect.stringContaining('HTTP 401): Invalid token') });
	});

	it('distinguishes non-auth failures', async () => {
		sendRequest.mockRejectedValueOnce(new HttpError('[redacted]', { status: 500, responseBody: 'boom' }));
		const result = await airparserAuth.validate?.({ auth: 'k', server: { apiUrl: '', publicUrl: '' } });
		expect(result).toEqual({ valid: false, error: expect.stringContaining('could not verify the API key (HTTP 500): boom') });
	});

	it('accepts a valid key and uses the verified TLS dispatcher', async () => {
		sendRequest.mockResolvedValueOnce(reply({ body: [] }));
		const result = await airparserAuth.validate?.({ auth: 'k', server: { apiUrl: '', publicUrl: '' } });
		expect(result).toEqual({ valid: true });
		expect(lastRequest().options).toEqual({ dispatcher: { verified: true } });
		expect(lastRequest().request.headers).toMatchObject({ 'X-API-Key': 'k' });
	});
});

describe('human actions', () => {
	const file = { filename: 'a.txt', extension: 'txt', data: Buffer.from('hello'), base64: Buffer.from('hello').toString('base64') };

	it('uploads native multipart without retries and returns a string id', async () => {
		sendRequest.mockResolvedValueOnce(reply({ body: '"doc-1"' }));
		const out = await runAction({ action: uploadDocumentAction, propsValue: { inboxId: 'in1', file, meta: { a: 1 } } });
		expect(out).toEqual({ docId: 'doc-1' });
		const { request } = lastRequest();
		expect(request.url).toBe('https://api.airparser.com/inboxes/in1/upload');
		expect(request.body).toBeInstanceOf(FormData);
		expect(request.retries).toBe(0);
		expect(request.redactBodyInErrors).toBe(true);
	});

	it('never leaks the file body in upload errors', async () => {
		sendRequest.mockRejectedValueOnce(new HttpError('[redacted]', { status: 413, responseBody: { message: 'Too large' } }));
		const error = await runAction({ action: uploadDocumentAction, propsValue: { inboxId: 'in1', file } }).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(Error);
		expect(String(error)).toContain('HTTP 413): Too large');
		expect(String(error)).not.toContain('hello');
	});

	it('warns the upload may have been applied on timeout', async () => {
		const abort = new Error('aborted');
		abort.name = 'AbortError';
		sendRequest.mockRejectedValueOnce(abort);
		await expect(runAction({ action: uploadDocumentAction, propsValue: { inboxId: 'in1', file } })).rejects.toThrow('may still have been applied');
	});

	it('reports a missing document instead of crashing', async () => {
		await expect(runAction({ action: extractDataFromDocumentAction, propsValue: { inboxId: 'in1' } })).rejects.toThrow('Document is required.');
		await expect(runAction({ action: uploadDocumentAction, propsValue: { file } })).rejects.toThrow('Inbox is required.');
		expect(sendRequest).not.toHaveBeenCalled();
	});

	it('drops the document secret', async () => {
		sendRequest.mockResolvedValueOnce(reply({ body: { _id: 'd1', secret: 's3cr3t', json: { total: 1 }, credits: 1 } }));
		const out = await runAction({ action: extractDataFromDocumentAction, propsValue: { inboxId: 'in1', documentId: 'd1' } });
		expect(JSON.stringify(out)).not.toContain('s3cr3t');
		expect(out).toMatchObject({ id: 'd1', json: { total: 1 }, credits: 1 });
	});
});

describe('ai actions', () => {
	it('list documents caps per_page and returns hasNextPage', async () => {
		await expect(runAction({ action: listDocumentsAiAction, propsValue: { inboxId: 'in1', perPage: 500 } })).rejects.toThrow('1 to 100');
		sendRequest.mockResolvedValueOnce(reply({ body: { docs: [{ _id: 'd1', name: 'n', status: 'parsed' }], hasNextPage: true } }));
		const out = await runAction({ action: listDocumentsAiAction, propsValue: { inboxId: 'in1', status: ['parsed'] } });
		expect(out).toMatchObject({ hasNextPage: true, page: 1, per_page: 25, docs: [{ id: 'd1' }] });
		expect(lastRequest().request.url).toContain('status%5B%5D=parsed');
	});

	it('get inbox projects out account fields', async () => {
		sendRequest.mockResolvedValueOnce(reply({ body: { _id: 'in1', name: 'N', owner_id: 'o1', email_prefix: 'abc', gpt_model: 'm', stats: { a: 1 }, llm_engine: 'text', is_active: true, retention: 30, schema: { fields: [{ type: 'scalar' }], updated_at: '2026-01-01T00:00:00Z' } } }));
		const out = await runAction({ action: getInboxAiAction, propsValue: { inboxId: 'in1' } });
		expect(out).toEqual({ id: 'in1', name: 'N', email_prefix: 'abc', llm_engine: 'text', model: 'm', is_active: true, retention: 30, schema: { fields: [{ type: 'scalar' }], updated_at: '2026-01-01T00:00:00Z' } });
	});

	it('get document drops owner_id and secret', async () => {
		sendRequest.mockResolvedValueOnce(reply({ body: { _id: 'd1', owner_id: 'o1', secret: 's' } }));
		const out = await runAction({ action: getDocumentAiAction, propsValue: { documentId: 'd1' } });
		expect(JSON.stringify(out)).not.toMatch(/o1|"s"/);
	});

	it('parse sync reports parsing in progress', async () => {
		sendRequest.mockResolvedValueOnce(reply({ body: { doc_id: 'd9', parsing_in_progress: true, status: 'importing', json: null } }));
		const out = await runAction({
			action: parseDocumentSyncAiAction,
			propsValue: { inboxId: 'in1', file: { filename: 'a.pdf', data: Buffer.from('x') } },
		});
		expect(out).toMatchObject({ doc_id: 'd9', parsing_in_progress: true, json: null });
	});

	it('upsert schema validates the field shape', async () => {
		await expect(runAction({ action: upsertExtractionSchemaAiAction, propsValue: { inboxId: 'in1', fields: '[{"name":"x"}]' } })).rejects.toThrow('Field 1');
		sendRequest.mockResolvedValueOnce(reply({ body: 'true' }));
		const out = await runAction({
			action: upsertExtractionSchemaAiAction,
			propsValue: { inboxId: 'in1', fields: '[{"type":"scalar","data":{"name":"total"}}]' },
		});
		expect(out).toEqual({ success: true, inbox_id: 'in1', field_count: 1 });
	});
});

describe('props', () => {
	it('stops paging documents at the cap and says so', async () => {
		sendRequest.mockResolvedValue(reply({ body: { docs: [{ _id: 'd', name: 'n' }], hasNextPage: true } }));
		const result = await documentIdDropdown.options({ auth: { secret_text: 'k' }, inboxId: 'in1' }, { searchValue: undefined, server: { apiUrl: '', publicUrl: '', token: '' } });
		expect(sendRequest).toHaveBeenCalledTimes(5);
		expect(result).toMatchObject({ disabled: false, placeholder: expect.stringContaining('newest 5') });
		sendRequest.mockReset();
	});
});

describe('trigger', () => {
	function runTrigger({ body }: { body: unknown }) {
		return Reflect.apply(documentParsedTrigger.run, documentParsedTrigger, [{ propsValue: { inboxId: 'in1' }, payload: { body } }]);
	}

	it('parses a string body and filters by inbox', async () => {
		const event = { event: 'doc.parsed', inbox_id: 'in1', doc_id: 'd1' };
		await expect(runTrigger({ body: JSON.stringify(event) })).resolves.toEqual([event]);
		await expect(runTrigger({ body: { ...event, inbox_id: 'other' } })).resolves.toEqual([]);
		await expect(runTrigger({ body: 'not json' })).resolves.toEqual([]);
	});

	it('accepts the live doc.parsed capture unchanged', async () => {
		const capture = { inbox_id: 'in1', doc_id: 'd1', event: 'doc.parsed', payload: { filename: 'ap-webhook-test.pdf', parsed: { document_title: 'Dummy PDF file', created_at: '2026-11-15T12:57:41.714Z' } } };
		await expect(runTrigger({ body: capture })).resolves.toEqual([capture]);
		const sample = documentParsedTrigger.sampleData;
		expect(Object.keys(sample)).toEqual(Object.keys(capture));
	});

	it('test() matches the live shape and sends status[]', async () => {
		sendRequest
			.mockResolvedValueOnce(reply({ body: { docs: [{ _id: 'd1' }] } }))
			.mockResolvedValueOnce(reply({ body: { _id: 'd1', filename: 'f.pdf', created_at: '2026-11-15T12:57:41.714Z', json: { a: 1 } } }));
		const out = await Reflect.apply(documentParsedTrigger.test, documentParsedTrigger, [
			{ auth: { secret_text: 'k' }, propsValue: { inboxId: 'in1' } },
		]);
		expect(out).toEqual([{ inbox_id: 'in1', doc_id: 'd1', event: 'doc.parsed', payload: { filename: 'f.pdf', parsed: { a: 1, created_at: '2026-11-15T12:57:41.714Z' } } }]);
		expect(sendRequest.mock.calls[0][0].url).toContain('status%5B%5D=parsed');
	});
});

describe('qa edge cases', () => {
	it('get document (ai) drops the secret and passes source=parsed only for yes', async () => {
		sendRequest.mockResolvedValueOnce(reply({ body: { _id: 'd1', secret: 's3cr3t', json: { a: 1 } } }));
		const out = await runAction({ action: getDocumentAiAction, propsValue: { documentId: 'd1', rawOutput: 'yes' } });
		expect(JSON.stringify(out)).not.toContain('s3cr3t');
		expect(lastRequest().request.url).toBe('https://api.airparser.com/docs/d1/extended?source=parsed');
		sendRequest.mockResolvedValueOnce(reply({ body: { _id: 'd1' } }));
		await runAction({ action: getDocumentAiAction, propsValue: { documentId: 'd1', rawOutput: 'no' } });
		expect(lastRequest().request.url).toBe('https://api.airparser.com/docs/d1/extended');
	});

	it('sync parse is never retried and redacts the body', async () => {
		sendRequest.mockResolvedValueOnce(reply({ body: { doc_id: 'd2', status: 'parsed', json: { t: 1 }, secret: 'zz' } }));
		const out = await runAction({ action: parseDocumentSyncAiAction, propsValue: { inboxId: 'in1', file: { filename: 'a.pdf', data: Buffer.from('x') } } });
		expect(JSON.stringify(out)).not.toContain('zz');
		expect(lastRequest().request).toMatchObject({ retries: 0, redactBodyInErrors: true });
		expect(sendRequest).toHaveBeenCalledTimes(1);
	});

	it('maps 429 with the vendor text and empty list bodies safely', async () => {
		sendRequest.mockRejectedValueOnce(new HttpError('[redacted]', { status: 429, responseBody: '{"error":"Too many requests"}' }));
		await expect(runAction({ action: listDocumentsAiAction, propsValue: { inboxId: 'in1' } })).rejects.toThrow('HTTP 429): Too many requests');
		sendRequest.mockResolvedValueOnce(reply({ body: '' }));
		await expect(runAction({ action: listDocumentsAiAction, propsValue: { inboxId: 'in1' } })).resolves.toMatchObject({ docs: [], hasNextPage: false });
	});

	it('rejects a malformed list inboxes response and bad dates', async () => {
		sendRequest.mockResolvedValueOnce(reply({ body: { oops: true } }));
		await expect(runAction({ action: listInboxesAiAction, propsValue: {} })).rejects.toThrow('unexpected response');
		await expect(runAction({ action: listDocumentsAiAction, propsValue: { inboxId: 'in1', from: '01/02/2026' } })).rejects.toThrow('YYYY-MM-DD');
		await expect(runAction({ action: listDocumentsAiAction, propsValue: { inboxId: '  ' } })).rejects.toThrow('Inbox ID is required');
	});

	it('trigger ignores other events', async () => {
		const out = await Reflect.apply(documentParsedTrigger.run, documentParsedTrigger, [
			{ propsValue: { inboxId: 'in1' }, payload: { body: { event: 'doc.failed', inbox_id: 'in1' } } },
		]);
		expect(out).toEqual([]);
	});
});
