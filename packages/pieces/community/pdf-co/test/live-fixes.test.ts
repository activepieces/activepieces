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
