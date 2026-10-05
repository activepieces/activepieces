import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	checkJobStatus,
	compressPdf,
	convertHtmlToPdf,
	convertPdfToStructuredFormat,
	extractTablesFromPdf,
	parseDocument,
	parseInvoiceWithAi,
} from '../src/lib/actions';
import { pdfCoClient } from '../src/lib/common/client';
import { pdfCoJobs } from '../src/lib/common/jobs';
import { API_KEY, binaryResponse, installFetch, jsonResponse, okFileResult, requestOf, runAction, STORAGE_URL } from './helpers';

let fetchMock: ReturnType<typeof installFetch>;

beforeEach(() => {
	fetchMock = installFetch();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

const PART_1 = 'https://pdf-temp-files.s3.us-west-2.amazonaws.com/A/sample_page1-1.pdf?X-Amz-Expires=3600';
const PART_2 = 'https://pdf-temp-files.s3.us-west-2.amazonaws.com/B/sample_page2-2.pdf?X-Amz-Expires=3600';
const LISTING = 'https://pdf-temp-files.s3.us-west-2.amazonaws.com/C/sample.json?X-Amz-Expires=3600';

describe('B8: profiles are sent as a JSON string', () => {
	it('serializes objects, keeps strings and drops empty values', () => {
		expect(pdfCoClient.serializeProfiles({ OutputStructure: 'OnlyLinks' })).toBe('{"OutputStructure":"OnlyLinks"}');
		expect(pdfCoClient.serializeProfiles("{ 'TrimSpaces': true }")).toBe("{ 'TrimSpaces': true }");
		expect(pdfCoClient.serializeProfiles({})).toBeUndefined();
		expect(pdfCoClient.serializeProfiles('  ')).toBeUndefined();
		expect(pdfCoClient.serializeProfiles(undefined)).toBeUndefined();
	});

	it('Convert PDF to structured format sends profiles as a string (an object gets HTTP 400 live)', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ body: okFileResult() }));
		await runAction({
			action: convertPdfToStructuredFormat,
			propsValue: { url: 'https://a.example/a.pdf', outputFormat: 'json', profiles: { OutputStructure: 'OnlyLinks' } },
		});
		expect(requestOf({ fetchMock, call: 0 }).body).toMatchObject({ profiles: '{"OutputStructure":"OnlyLinks"}' });
	});

	it('Extract Tables sends profiles as a string', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ body: { body: { objects: [] } } }));
		await runAction({
			action: extractTablesFromPdf,
			propsValue: { url: 'https://a.example/a.pdf', templateId: '1', profiles: { DetectNewColumnBySpacesRatio: 1.5 } },
		});
		expect(requestOf({ fetchMock, call: 0 }).body).toMatchObject({ profiles: '{"DetectNewColumnBySpacesRatio":1.5}' });
	});

	it('Convert HTML sends profiles as a string and omits an empty object', async () => {
		fetchMock.mockImplementation(async () => jsonResponse({ body: okFileResult() }));
		await runAction({ action: convertHtmlToPdf, propsValue: { html: '<p>x</p>', profiles: { PreserveFormattingOnTextExtraction: true } } });
		expect(requestOf({ fetchMock, call: 0 }).body).toMatchObject({ profiles: '{"PreserveFormattingOnTextExtraction":true}' });
		await runAction({ action: convertHtmlToPdf, propsValue: { html: '<p>x</p>', profiles: {} } });
		expect(requestOf({ fetchMock, call: 1 }).body).not.toHaveProperty('profiles');
	});
});

describe('background jobs report the credits of the whole job', () => {
	it('adds the start call and every status check (live: compress 35 + 2 + 2 = 39)', async () => {
		vi.useFakeTimers();
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ body: { jobId: 'J1', status: 'working', credits: 35, remainingCredits: 100 } }))
			.mockResolvedValueOnce(jsonResponse({ body: { status: 'working', credits: 2, remainingCredits: 98 } }))
			.mockResolvedValueOnce(jsonResponse({ body: { status: 'success', url: STORAGE_URL, pageCount: 1, credits: 2, remainingCredits: 96 } }));
		const pending = runAction({
			action: compressPdf,
			propsValue: { sourceUrl: 'https://a.example/a.pdf', runInBackground: true, saveOutputFile: false },
		});
		await vi.advanceTimersByTimeAsync(3_000 + 5_000);
		await expect(pending).resolves.toMatchObject({ status: 'success', job_id: 'J1', credits_used: 39, remaining_credits: 96 });
	});

	it('keeps the summed credits when the ceiling is reached', async () => {
		vi.useFakeTimers();
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ body: { jobId: 'J2', credits: 8 } }))
			.mockImplementation(async () => jsonResponse({ body: { status: 'working', credits: 2, remainingCredits: 50 } }));
		const pending = pdfCoJobs.runJob({ apiKey: API_KEY, path: '/v1/pdf/split', body: {}, background: true, pollCeilingMs: 10_000 });
		await vi.advanceTimersByTimeAsync(10_000);
		const result = await pending;
		expect(result.status).toBe('working');
		expect(result.body).toMatchObject({ credits: 8 + 2 * (fetchMock.mock.calls.length - 1), remainingCredits: 50 });
	});

	it('Parse Invoice with AI reports the 100 credits of the start call, not the free check', async () => {
		vi.useFakeTimers();
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ body: { jobId: 'INV', status: 'working', credits: 100, remainingCredits: 8489 } }))
			.mockResolvedValueOnce(
				jsonResponse({ body: { status: 'success', jobId: 'INV', pageCount: 1, body: { vendor: { name: 'ACME Inc.' } }, credits: 0, remainingCredits: 8489 } }),
			);
		const pending = runAction({ action: parseInvoiceWithAi, propsValue: { sourceUrl: 'https://a.example/inv.pdf' } });
		await vi.advanceTimersByTimeAsync(3_000);
		await expect(pending).resolves.toMatchObject({ status: 'success', vendor_name: 'ACME Inc.', credits_used: 100, remaining_credits: 8489 });
	});
});

describe('finished split jobs', () => {
	it('takes the part links from the job/check body without downloading the JSON listing', async () => {
		const output = await pdfCoJobs.buildFileOutput({
			result: { body: { status: 'success', url: LISTING, body: [PART_1, PART_2] }, status: 'success', jobId: 'S1' },
			files: { write: async () => 'unused' },
			saveOutputFile: false,
			multiOutput: true,
		});
		expect(output).toMatchObject({ url: PART_1, urls: [PART_1, PART_2] });
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('Check Job Status returns the part links and saves each part', async () => {
		const written: { fileName: string; size: number }[] = [];
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ body: { status: 'success', message: 'Success', url: LISTING, body: [PART_1, PART_2], credits: 2, remainingCredits: 9311 } }))
			.mockResolvedValueOnce(binaryResponse({ data: Buffer.from('p1') }))
			.mockResolvedValueOnce(binaryResponse({ data: Buffer.from('p2!') }));
		const result = await runAction({ action: checkJobStatus, propsValue: { jobId: 'S1', saveOutputFile: true }, written });
		expect(result).toMatchObject({
			status: 'success',
			url: LISTING,
			urls: [PART_1, PART_2],
			file: 'https://files.example/sample_page1-1.pdf',
			files: ['https://files.example/sample_page1-1.pdf', 'https://files.example/sample_page2-2.pdf'],
			credits_used: 2,
		});
		expect(written).toEqual([
			{ fileName: 'sample_page1-1.pdf', size: 2 },
			{ fileName: 'sample_page2-2.pdf', size: 3 },
		]);
	});

	it('Check Job Status leaves urls out for single-file jobs', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ body: { status: 'success', url: STORAGE_URL, credits: 2 } }));
		const result = await runAction({ action: checkJobStatus, propsValue: { jobId: 'C1' } });
		expect(result).toMatchObject({ status: 'success', url: STORAGE_URL });
		expect(result).not.toHaveProperty('urls', expect.anything());
	});
});

describe('Parse Document table page', () => {
	it('falls back to the first cell page when the table has no pageIndex (live shape)', async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse({
				body: {
					body: {
						templateName: 'Generic Invoice [en]',
						objects: [
							{ name: 'total', objectType: 'field', value: 1272.35 },
							{ name: 'table', objectType: 'table', rows: [{ column1: { pageIndex: 0, value: '2' }, column2: { pageIndex: 0, value: 'Item 1' } }] },
						],
					},
					pageCount: 1,
					credits: 42,
				},
			}),
		);
		const result = await runAction({ action: parseDocument, propsValue: { sourceUrl: 'https://a.example/inv.pdf', templateId: '1' } });
		expect(result).toMatchObject({ fields: { total: 1272.35 }, tables: [{ name: 'table', page_index: 0 }], credits_used: 42 });
	});
});

describe('error text', () => {
	it('does not double the full stop after a vendor message that ends with one', async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse({ status: 400, body: { errorCode: 400, error: true, message: 'Incorrect input parameters, please check and try again.' } }),
		);
		const error = await pdfCoClient.request({ apiKey: API_KEY, method: HttpMethod.POST, path: '/v1/pdf/convert/to/json2', body: {} }).catch((e: unknown) => e);
		expect(String(error)).toContain('(400): Incorrect input parameters, please check and try again. Check the input values');
		expect(String(error)).not.toContain('..');
	});
});

function urlOf(input: unknown): string {
	if (typeof input === 'string') {
		return input;
	}
	if (input instanceof URL) {
		return input.toString();
	}
	return input instanceof Request ? input.url : String(input);
}

describe('Greptile round 1: background results', () => {
	it('Check Job Status reads the part links from the JSON listing when job/check has no list, and saves the parts', async () => {
		const written: { fileName: string; size: number }[] = [];
		fetchMock.mockImplementation(async (input: unknown) => {
			const url = urlOf(input);
			if (url.includes('/v1/job/check')) {
				return jsonResponse({ body: { status: 'success', url: LISTING, credits: 2 } });
			}
			if (url === LISTING) {
				return jsonResponse({ body: [PART_1, PART_2] });
			}
			return binaryResponse({ data: Buffer.from(url === PART_1 ? 'p1' : 'p2!') });
		});
		const result = await runAction({ action: checkJobStatus, propsValue: { jobId: 'S2', saveOutputFile: true }, written });
		expect(result).toMatchObject({
			status: 'success',
			urls: [PART_1, PART_2],
			files: ['https://files.example/sample_page1-1.pdf', 'https://files.example/sample_page2-2.pdf'],
		});
		expect(written.map((entry) => entry.fileName).sort()).toEqual(['sample_page1-1.pdf', 'sample_page2-2.pdf']);
	});

	it('Check Job Status saves a JSON result as one file when it is not a list of links', async () => {
		const written: { fileName: string; size: number }[] = [];
		fetchMock.mockImplementation(async (input: unknown) => {
			if (urlOf(input).includes('/v1/job/check')) {
				return jsonResponse({ body: { status: 'success', url: LISTING } });
			}
			return jsonResponse({ body: [{ text: 'page 1' }] });
		});
		const result = await runAction({ action: checkJobStatus, propsValue: { jobId: 'J9', saveOutputFile: true }, written });
		expect(result).toMatchObject({ status: 'success', url: LISTING, file: 'https://files.example/sample.json' });
		expect(result).not.toHaveProperty('urls', expect.anything());
		expect(written).toHaveLength(1);
	});

	it('keeps the saved parts and names the failed one when a single part cannot be downloaded', async () => {
		const written: { fileName: string; size: number }[] = [];
		fetchMock.mockImplementation(async (input: unknown) =>
			urlOf(input) === PART_1
				? binaryResponse({ data: Buffer.from('p1') })
				: binaryResponse({ data: Buffer.from('x'), headers: { 'content-length': String(200 * 1024 * 1024) } }),
		);
		const output = await pdfCoJobs.buildFileOutput({
			result: { body: { status: 'success', body: [PART_1, PART_2] }, status: 'success', jobId: 'S3' },
			files: {
				write: async ({ fileName, data }) => {
					written.push({ fileName, size: data.byteLength });
					return `https://files.example/${fileName}`;
				},
			},
			saveOutputFile: true,
			multiOutput: true,
		});
		expect(output.files).toEqual(['https://files.example/sample_page1-1.pdf', null]);
		expect(output.file).toBe('https://files.example/sample_page1-1.pdf');
		expect(output.file_error).toContain('1 of 2 results could not be saved as files (part 2)');
		expect(output.urls).toEqual([PART_1, PART_2]);
	});

	it('Parse Invoice with AI picks up a running job by Job ID without starting a new parse', async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse({ body: { status: 'success', pageCount: 1, body: { vendor: { name: 'ACME Inc.' }, paymentDetails: { total: '$5' } }, credits: 0 } }),
		);
		const result = await runAction({ action: parseInvoiceWithAi, propsValue: { jobId: ' INV9 ' } });
		expect(result).toMatchObject({ status: 'success', job_id: 'INV9', vendor_name: 'ACME Inc.', total: '$5' });
		expect(fetchMock).toHaveBeenCalledTimes(1);
		expect(requestOf({ fetchMock, call: 0 })).toMatchObject({ url: 'https://api.pdf.co/v1/job/check', body: { jobid: 'INV9' } });
	});

	it('Parse Invoice with AI returns working again with the same Job ID when the job is still running', async () => {
		vi.useFakeTimers();
		fetchMock.mockImplementation(async () => jsonResponse({ body: { status: 'working' } }));
		const pending = runAction({ action: parseInvoiceWithAi, propsValue: { jobId: 'INV10' } });
		await vi.advanceTimersByTimeAsync(241_000);
		await expect(pending).resolves.toMatchObject({ status: 'working', job_id: 'INV10' });
		expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.pdf.co/v1/job/check');
	});

	it('keeps each saved file at its part number when part 1 fails and part 2 saves', async () => {
		fetchMock.mockImplementation(async (input: unknown) =>
			urlOf(input) === PART_2
				? binaryResponse({ data: Buffer.from('p2') })
				: binaryResponse({ data: Buffer.from('x'), headers: { 'content-length': String(200 * 1024 * 1024) } }),
		);
		const output = await pdfCoJobs.buildFileOutput({
			result: { body: { status: 'success', body: [PART_1, PART_2] }, status: 'success', jobId: 'S4' },
			files: { write: async ({ fileName }) => `https://files.example/${fileName}` },
			saveOutputFile: true,
			multiOutput: true,
		});
		expect(output.urls).toEqual([PART_1, PART_2]);
		expect(output.files).toEqual([null, 'https://files.example/sample_page2-2.pdf']);
		expect(output).not.toHaveProperty('file');
		expect(output.file_error).toContain('1 of 2 results could not be saved as files (part 1)');
	});

	it('Check Job Status keeps each saved file at its part number when part 1 fails', async () => {
		fetchMock.mockImplementation(async (input: unknown) => {
			const url = urlOf(input);
			if (url.includes('/v1/job/check')) {
				return jsonResponse({ body: { status: 'success', url: LISTING, body: [PART_1, PART_2], credits: 2 } });
			}
			return url === PART_2
				? binaryResponse({ data: Buffer.from('p2') })
				: binaryResponse({ data: Buffer.from('x'), headers: { 'content-length': String(200 * 1024 * 1024) } });
		});
		const result = await runAction({ action: checkJobStatus, propsValue: { jobId: 'S5', saveOutputFile: true }, written: [] });
		expect(result).toMatchObject({ urls: [PART_1, PART_2], files: [null, 'https://files.example/sample_page2-2.pdf'] });
		expect(result).not.toHaveProperty('file');
		expect(result['file_error']).toContain('(part 1)');
	});
});
