import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pdfCoFiles } from '../src/lib/common/files';
import { pdfCoJobs } from '../src/lib/common/jobs';
import { API_KEY, binaryResponse, installFetch, jsonResponse, okFileResult, requestOf, STORAGE_URL } from './helpers';

let fetchMock: ReturnType<typeof installFetch>;

beforeEach(() => {
	fetchMock = installFetch();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

const memoryFiles = () => {
	const written: { fileName: string; size: number }[] = [];
	return {
		written,
		files: {
			write: async ({ fileName, data }: { fileName: string; data: Buffer }) => {
				written.push({ fileName, size: data.byteLength });
				return `https://files.example/${fileName}`;
			},
		},
	};
};

describe('storage host pinning', () => {
	it('accepts only PDF.co temporary storage over https', () => {
		expect(pdfCoFiles.isStorageUrl('https://pdf-temp-files.s3.amazonaws.com/a/b.pdf')).toBe(true);
		expect(pdfCoFiles.isStorageUrl('https://pdf-temp-files.s3.us-west-2.amazonaws.com/a/b.pdf')).toBe(true);
		expect(pdfCoFiles.isStorageUrl('https://pdf-temp-files.s3.amazonaws.com.evil.io/a.pdf')).toBe(false);
		expect(pdfCoFiles.isStorageUrl('http://pdf-temp-files.s3.amazonaws.com/a.pdf')).toBe(false);
		expect(pdfCoFiles.isStorageUrl('https://user@pdf-temp-files.s3.amazonaws.com/a.pdf')).toBe(false);
		expect(pdfCoFiles.isStorageUrl('https://pdf-temp-files.s3.amazonaws.com:8443/a.pdf')).toBe(false);
		expect(pdfCoFiles.isStorageUrl('https://evil-pdf-temp-files.s3.amazonaws.com/a.pdf')).toBe(false);
	});

	it('does not download a result link from another host', async () => {
		await expect(pdfCoFiles.downloadStorageFile({ url: 'https://pdf-temp-files.s3.amazonaws.com.evil.io/x.pdf' })).rejects.toThrow(
			'not on PDF.co file storage',
		);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('does not follow a redirect off the storage host and does not save the redirect body', async () => {
		fetchMock.mockResolvedValueOnce(new Response('moved', { status: 302, headers: { location: 'http://169.254.169.254/latest/meta-data/' } }));
		await expect(pdfCoFiles.downloadStorageFile({ url: STORAGE_URL })).rejects.toThrow('HTTP 302');
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(requestOf({ fetchMock, call: 0 }).redirect).toBe('manual');
	});

	it('fails the upload when the presigned PUT answers with a redirect', async () => {
		fetchMock
			.mockResolvedValueOnce(
				jsonResponse({
					body: {
						presignedUrl: 'https://pdf-temp-files.s3.us-west-2.amazonaws.com/u/doc.pdf?X-Amz-SignedHeaders=host',
						url: 'https://pdf-temp-files.s3.us-west-2.amazonaws.com/u/doc.pdf',
					},
				}),
			)
			.mockResolvedValueOnce(new Response(null, { status: 307, headers: { location: 'http://127.0.0.1/' } }));
		await expect(pdfCoFiles.uploadFile({ apiKey: API_KEY, file: { filename: 'doc.pdf', data: Buffer.from('x') } })).rejects.toThrow(
			'HTTP 307',
		);
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});
});

describe('source resolution', () => {
	it('needs exactly one of URL or file, before any request', async () => {
		await expect(pdfCoFiles.resolveSource({ apiKey: API_KEY, url: '', file: undefined })).rejects.toThrow('give a file URL or pick a file');
		await expect(
			pdfCoFiles.resolveSource({ apiKey: API_KEY, url: 'https://a.example/x.pdf', file: { filename: 'a.pdf', data: Buffer.from('x') } }),
		).rejects.toThrow('not both');
		await expect(pdfCoFiles.resolveSource({ apiKey: API_KEY, url: 'ftp://a.example/x.pdf', file: undefined })).rejects.toThrow('http://');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('accepts a cache: prefixed URL as is', async () => {
		await expect(pdfCoFiles.resolveSource({ apiKey: API_KEY, url: ' cache:https://a.example/x.pdf ', file: undefined })).resolves.toBe(
			'cache:https://a.example/x.pdf',
		);
	});

	it('uploads a file with a presigned PUT that carries the same content type and no API key', async () => {
		fetchMock
			.mockResolvedValueOnce(
				jsonResponse({
					body: {
						presignedUrl: 'https://pdf-temp-files.s3.us-west-2.amazonaws.com/u/doc.pdf?X-Amz-SignedHeaders=content-type;host',
						url: 'https://pdf-temp-files.s3.us-west-2.amazonaws.com/u/doc.pdf?X-Amz-Expires=3600',
						error: false,
						status: 200,
					},
				}),
			)
			.mockResolvedValueOnce(new Response(null, { status: 200 }));
		const url = await pdfCoFiles.resolveSource({ apiKey: API_KEY, url: undefined, file: { filename: 'doc.pdf', data: Buffer.from('%PDF-1.4') } });
		expect(url).toBe('https://pdf-temp-files.s3.us-west-2.amazonaws.com/u/doc.pdf?X-Amz-Expires=3600');
		const presign = requestOf({ fetchMock, call: 0 });
		expect(presign.url).toBe('https://api.pdf.co/v1/file/upload/get-presigned-url?name=doc.pdf&contenttype=application%2Fpdf');
		const put = requestOf({ fetchMock, call: 1 });
		expect(put.method).toBe('PUT');
		expect(put.headers['content-type']).toBe('application/pdf');
		expect(put.headers['x-api-key']).toBeUndefined();
		expect(put.redirect).toBe('manual');
	});

	it('refuses to PUT to a presigned URL outside PDF.co storage', async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse({ body: { presignedUrl: 'https://pdf-temp-files.s3.amazonaws.com.evil.io/u', url: 'https://pdf-temp-files.s3.amazonaws.com/u' } }),
		);
		await expect(pdfCoFiles.uploadFile({ apiKey: API_KEY, file: { filename: 'a.pdf', data: Buffer.from('x') } })).rejects.toThrow(
			'outside its file storage',
		);
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('duck-types files instead of instanceof', () => {
		expect(pdfCoFiles.isFileLike({ filename: 'a.pdf', data: Buffer.from('x'), extension: 'pdf' })).toBe(true);
		expect(pdfCoFiles.isFileLike({ filename: 'a.pdf', data: 'x' })).toBe(false);
	});
});

describe('save output to file', () => {
	it('downloads the result with Accept */* and no API key, then writes it to the flow', async () => {
		const { files, written } = memoryFiles();
		fetchMock.mockResolvedValueOnce(binaryResponse({ data: Buffer.from('%PDF-result') }));
		const output = await pdfCoJobs.buildFileOutput({ result: { body: okFileResult(), status: 'success' }, files, saveOutputFile: true, fileName: 'out.pdf' });
		expect(output).toMatchObject({ status: 'success', url: STORAGE_URL, file: 'https://files.example/out.pdf', page_count: 2, credits_used: 4 });
		expect(written).toEqual([{ fileName: 'out.pdf', size: 11 }]);
		const download = requestOf({ fetchMock, call: 0 });
		expect(download.headers['accept']).toBe('*/*');
		expect(download.headers['x-api-key']).toBeUndefined();
	});

	it('reports a failed download in file_error instead of failing the step', async () => {
		const { files } = memoryFiles();
		fetchMock.mockResolvedValueOnce(binaryResponse({ data: Buffer.from('x'), headers: { 'content-length': String(200 * 1024 * 1024) } }));
		const output = await pdfCoJobs.buildFileOutput({ result: { body: okFileResult(), status: 'success' }, files, saveOutputFile: true });
		expect(output.file).toBeUndefined();
		expect(output.file_error).toContain('larger than 100 MB');
		expect(output.url).toBe(STORAGE_URL);
	});

	it('does not download when saving is off', async () => {
		const { files } = memoryFiles();
		const output = await pdfCoJobs.buildFileOutput({ result: { body: okFileResult(), status: 'success' }, files, saveOutputFile: false });
		expect(output.file).toBeUndefined();
		expect(fetchMock).not.toHaveBeenCalled();
	});
});

describe('background jobs', () => {
	it('sends async true, polls job/check and returns the finished result', async () => {
		vi.useFakeTimers();
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ body: { jobId: 'JOB1', url: STORAGE_URL, error: false, status: 200 } }))
			.mockResolvedValueOnce(jsonResponse({ body: { status: 'working', remainingCredits: 10 } }))
			.mockResolvedValueOnce(jsonResponse({ body: { status: 'success', url: STORAGE_URL, jobId: 'JOB1', credits: 2, pageCount: 3 } }));
		const pending = pdfCoJobs.runJob({ apiKey: API_KEY, path: '/v1/pdf/merge', body: { url: 'a,b' }, background: true });
		await vi.advanceTimersByTimeAsync(3_000 + 5_000);
		const result = await pending;
		expect(result).toMatchObject({ status: 'success', jobId: 'JOB1', body: { pageCount: 3 } });
		expect(requestOf({ fetchMock, call: 0 }).body).toMatchObject({ async: true, url: 'a,b' });
		expect(requestOf({ fetchMock, call: 1 })).toMatchObject({ url: 'https://api.pdf.co/v1/job/check', body: { jobid: 'JOB1' } });
	});

	it('returns the job ID with status working when the 240 s ceiling is reached', async () => {
		vi.useFakeTimers();
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ body: { jobId: 'JOB2', url: STORAGE_URL, error: false } }))
			.mockImplementation(async () => jsonResponse({ body: { status: 'working' } }));
		const pending = pdfCoJobs.runJob({ apiKey: API_KEY, path: '/v1/pdf/split', body: { url: 'a' }, background: true });
		await vi.advanceTimersByTimeAsync(241_000);
		const result = await pending;
		expect(result).toMatchObject({ status: 'working', jobId: 'JOB2' });
		const checks = fetchMock.mock.calls.length - 1;
		expect(checks).toBeLessThanOrEqual(12);
		expect(checks).toBeGreaterThan(5);
	});

	it('throws with the vendor message when the job fails', async () => {
		vi.useFakeTimers();
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ body: { jobId: 'JOB3' } }))
			.mockResolvedValueOnce(jsonResponse({ body: { status: 'failed', message: 'Damaged file' } }));
		const pending = pdfCoJobs.runJob({ apiKey: API_KEY, path: '/v1/pdf/merge', body: {}, background: true }).catch((e: unknown) => e);
		await vi.advanceTimersByTimeAsync(3_000);
		expect(String(await pending)).toContain('PDF.co background job JOB3 failed: Damaged file');
	});

	it('stops polling on a 404 job', async () => {
		vi.useFakeTimers();
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ body: { jobId: 'JOB4' } }))
			.mockResolvedValueOnce(jsonResponse({ status: 404, body: { errorCode: 404, error: true, message: 'Job not found' } }));
		const pending = pdfCoJobs.runJob({ apiKey: API_KEY, path: '/v1/pdf/merge', body: {}, background: true }).catch((e: unknown) => e);
		await vi.advanceTimersByTimeAsync(3_000);
		expect(String(await pending)).toContain('PDF.co request failed (404): Job not found');
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('reads split part links from the JSON result file of a finished background job', async () => {
		const { files } = memoryFiles();
		const jsonUrl = 'https://pdf-temp-files.s3.us-west-2.amazonaws.com/j/result.json?X-Amz-Expires=3600';
		fetchMock.mockResolvedValueOnce(
			new Response(JSON.stringify(['https://pdf-temp-files.s3.amazonaws.com/p1.pdf', 'https://pdf-temp-files.s3.amazonaws.com/p2.pdf'])),
		);
		const output = await pdfCoJobs.buildFileOutput({
			result: { body: { url: jsonUrl, status: 'success' }, status: 'success', jobId: 'J' },
			files,
			saveOutputFile: false,
			multiOutput: true,
		});
		expect(output.urls).toEqual(['https://pdf-temp-files.s3.amazonaws.com/p1.pdf', 'https://pdf-temp-files.s3.amazonaws.com/p2.pdf']);
		expect(output.url).toBe('https://pdf-temp-files.s3.amazonaws.com/p1.pdf');
	});
});
