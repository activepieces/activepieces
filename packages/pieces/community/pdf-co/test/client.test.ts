import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pdfCoClient, PdfCoError } from '../src/lib/common/client';
import { pdfCoAuth } from '../src/lib/auth';
import { API_KEY, installFetch, jsonResponse, requestOf } from './helpers';

let fetchMock: ReturnType<typeof installFetch>;

beforeEach(() => {
	fetchMock = installFetch();
});

afterEach(() => {
	vi.useRealTimers();
	vi.unstubAllGlobals();
});

describe('pdfCoRequest', () => {
	it('sends the API key only in the x-api-key header to api.pdf.co', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ body: { remainingCredits: 5 } }));
		await pdfCoClient.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/v1/account/credit/balance' });
		const request = requestOf({ fetchMock, call: 0 });
		expect(request.url).toBe('https://api.pdf.co/v1/account/credit/balance');
		expect(request.headers['x-api-key']).toBe(API_KEY);
		expect(request.url).not.toContain(API_KEY);
		expect(request.redirect).toBe('manual');
	});

	it('treats a redirect from api.pdf.co as a failure instead of following it', async () => {
		fetchMock.mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/' } }));
		const error = await pdfCoClient.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/v1/account/credit/balance' }).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(PdfCoError);
		expect(String(error)).toContain('(302)');
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	it('B1: never puts the PDF password, HTTP password or API key into the error message', async () => {
		fetchMock.mockResolvedValueOnce(
			jsonResponse({ status: 441, body: { status: 'error', errorCode: 441, error: true, message: `Invalid password s3cret-pdf for ${API_KEY}` } }),
		);
		const error = await pdfCoClient
			.request({
				apiKey: API_KEY,
				method: HttpMethod.POST,
				path: '/v1/pdf/info',
				body: { url: 'https://example.com/a.pdf', password: 's3cret-pdf', httppassword: 'http-s3cret', httpusername: 'bob' },
			})
			.catch((e: unknown) => e);
		expect(error).toBeInstanceOf(PdfCoError);
		const text = String(error) + JSON.stringify(error);
		expect(text).not.toContain('s3cret-pdf');
		expect(text).not.toContain('http-s3cret');
		expect(text).not.toContain(API_KEY);
		expect(String(error)).toContain('PDF.co request failed (441)');
		expect(String(error)).toContain('PDF password is wrong');
	});

	it('B1: a 400 error body does not echo the request body', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ status: 400, body: { error: true, errorCode: 400, message: 'Unable to download the file' } }));
		const error = await pdfCoClient
			.request({ apiKey: API_KEY, method: HttpMethod.POST, path: '/v1/pdf/info', body: { url: 'x', httppassword: 'top-secret-1' } })
			.catch((e: unknown) => e);
		expect(String(error)).not.toContain('top-secret-1');
		expect(JSON.stringify(error)).not.toContain('top-secret-1');
	});

	it('keeps status and responseBody but never a field named body on the error', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ status: 402, body: { error: true, errorCode: 402, message: 'Not enough credits' } }));
		const error = await pdfCoClient.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/v1/templates/html' }).catch((e: unknown) => e);
		expect(error).toBeInstanceOf(PdfCoError);
		expect(error).toMatchObject({ status: 402, errorCode: 402, responseBody: { errorCode: 402, message: 'Not enough credits' } });
		expect(Object.keys(pdfCoClient.readRecord(error))).not.toContain('body');
		expect(String(error)).toContain('out of credits');
	});

	it('throws when PDF.co answers HTTP 200 with error: true', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ status: 200, body: { error: true, status: 'error', errorCode: 445, message: 'Timeout' } }));
		await expect(
			pdfCoClient.request({ apiKey: API_KEY, method: HttpMethod.POST, path: '/v1/pdf/merge', body: { url: 'a,b' } }),
		).rejects.toThrow('PDF.co request failed (445): Timeout. The job took longer than 30 seconds');
	});

	it('retries a 429 after a 5 s backoff and then succeeds', async () => {
		vi.useFakeTimers();
		fetchMock
			.mockResolvedValueOnce(jsonResponse({ status: 429, body: { message: 'Too many requests' } }))
			.mockResolvedValueOnce(jsonResponse({ body: { remainingCredits: 7 } }));
		const pending = pdfCoClient.request<{ remainingCredits: number }>({ apiKey: API_KEY, method: HttpMethod.GET, path: '/v1/account/credit/balance' });
		await vi.advanceTimersByTimeAsync(4_000);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		await vi.advanceTimersByTimeAsync(1_000);
		await expect(pending).resolves.toEqual({ remainingCredits: 7 });
		expect(fetchMock).toHaveBeenCalledTimes(2);
	});

	it('gives up after two 429 retries (20 s of waiting in total)', async () => {
		vi.useFakeTimers();
		fetchMock.mockImplementation(async () => jsonResponse({ status: 429, body: { message: 'Too many requests' } }));
		const pending = pdfCoClient.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/v1/account/credit/balance' }).catch((e: unknown) => e);
		await vi.advanceTimersByTimeAsync(20_000);
		const error = await pending;
		expect(String(error)).toContain('PDF.co request failed (429)');
		expect(fetchMock).toHaveBeenCalledTimes(3);
	});

	it('refuses paths that would leave the PDF.co API', async () => {
		await expect(pdfCoClient.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '//evil.io/v1/x' })).rejects.toThrow('Invalid PDF.co API path');
		await expect(pdfCoClient.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/v1/../x' })).rejects.toThrow('Invalid PDF.co API path');
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('redacts secrets from network errors', async () => {
		fetchMock.mockRejectedValueOnce(new Error(`socket hang up near ${API_KEY}`));
		await expect(pdfCoClient.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/v1/account/credit/balance' })).rejects.toThrow(
			'Could not reach PDF.co: socket hang up near ***',
		);
	});
});

describe('auth validate', () => {
	const validate = pdfCoAuth.validate;

	it('is invalid only on 401 or 403', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ status: 401, body: { status: 'error', errorCode: 401, error: true, message: 'Unauthorized' } }));
		await expect(validate?.({ auth: ' bad ', server: { apiUrl: '', publicUrl: '', token: '' } })).resolves.toMatchObject({ valid: false });
		expect(requestOf({ fetchMock, call: 0 }).headers['x-api-key']).toBe('bad');
	});

	it('stays valid on a 500 so an outage does not block saving the connection', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ status: 500, body: { message: 'oops' } }));
		await expect(validate?.({ auth: 'good', server: { apiUrl: '', publicUrl: '', token: '' } })).resolves.toEqual({ valid: true });
	});

	it('is valid when the free balance call succeeds', async () => {
		fetchMock.mockResolvedValueOnce(jsonResponse({ body: { remainingCredits: 10 } }));
		await expect(validate?.({ auth: 'good', server: { apiUrl: '', publicUrl: '', token: '' } })).resolves.toEqual({ valid: true });
		expect(requestOf({ fetchMock, call: 0 }).url).toBe('https://api.pdf.co/v1/account/credit/balance');
	});
});
