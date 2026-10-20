/// <reference types="vitest/globals" />

import { HttpError, HttpRequest, HttpResponse, httpClient } from '@activepieces/pieces-common';
import { validateMagicalApiKey } from '../src/lib/common/auth';
import { MagicalApiError, magicalApiRequest } from '../src/lib/common/client';
import { fetchJobResult, runJob, POLL_MAX_ATTEMPTS } from '../src/lib/common/poll';
import { toProfileSlug } from '../src/lib/actions/get-profile-data';
import { magicalApi } from '../src/index';
import { AppConnectionType, createMockActionContext } from '@activepieces/pieces-framework';
import { parseResume } from '../src/lib/actions/parse-resume';
import { reviewResume } from '../src/lib/actions/review-resume';
import { scoreResume } from '../src/lib/actions/score-resume';
import { getProfileData } from '../src/lib/actions/get-profile-data';
import { getCompanyData } from '../src/lib/actions/get-company-data';

let sendRequest: ReturnType<typeof vi.spyOn>;
let requests: HttpRequest[];

beforeEach(() => {
  requests = [];
  sendRequest = vi.spyOn(httpClient, 'sendRequest');
});

afterEach(() => {
  vi.restoreAllMocks();
});

function respondWith(...responses: Array<{ status: number; body: unknown }>) {
  let index = 0;
  sendRequest.mockImplementation(async (request: HttpRequest): Promise<HttpResponse> => {
    requests.push(request);
    const next = responses[Math.min(index, responses.length - 1)];
    index++;
    if (next.status >= 400) {
      throw new HttpError(request.body, { status: next.status, responseBody: next.body });
    }
    return { status: next.status, headers: {}, body: next.body };
  });
}

const noSleep = async () => undefined;

describe('magicalApiRequest', () => {
  it('sends POST with api-key header and JSON body to the gateway', async () => {
    respondWith({ status: 201, body: { data: { request_id: 'r1' } } });
    await magicalApiRequest({ apiKey: ' key ', path: '/profile-data', body: { profile_name: 'williamhgates' } });
    expect(requests[0]).toMatchObject({
      method: 'POST',
      url: 'https://gw.magicalapi.com/profile-data',
      headers: { 'api-key': 'key', 'Content-Type': 'application/json' },
      body: { profile_name: 'williamhgates' },
    });
  });

  it.each([
    [401, 'rejected the API key'],
    [402, 'out of credits'],
    [429, 'rate limit'],
    [500, 'server error'],
  ])('maps %i to MagicalApiError with status and responseBody', async (status, text) => {
    const vendorBody = { message: 'vendor says no' };
    respondWith({ status, body: vendorBody });
    const error = await magicalApiRequest({ apiKey: 'k', path: '/resume-parser', body: { url: 'https://x.io/a.pdf' } }).catch(
      (e: unknown) => e,
    );
    expect(error).toBeInstanceOf(MagicalApiError);
    if (!(error instanceof MagicalApiError)) return;
    expect(error.status).toBe(status);
    expect(error.responseBody).toEqual(vendorBody);
    expect(error.message).toContain(text);
    expect(error.message).toContain('vendor says no');
    expect(error).not.toHaveProperty('body');
  });

  it('reports network failures without a status', async () => {
    sendRequest.mockRejectedValue(new Error('ECONNRESET'));
    const error = await magicalApiRequest({ apiKey: 'k', path: '/x', body: {} }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(MagicalApiError);
    if (!(error instanceof MagicalApiError)) return;
    expect(error.status).toBe(0);
    expect(error.message).toContain('ECONNRESET');
  });
});

describe('validateMagicalApiKey', () => {
  it('uses a dummy request_id poll, never a billable job', async () => {
    respondWith({ status: 404, body: { message: 'request id not found!' } });
    await expect(validateMagicalApiKey({ apiKey: 'good' })).resolves.toEqual({ valid: true });
    expect(requests).toHaveLength(1);
    expect(requests[0].body).toEqual({ request_id: 'activepieces-connection-check' });
    expect(Object.keys(requests[0].body ?? {})).toEqual(['request_id']);
  });

  it('reports invalid key only on 401', async () => {
    respondWith({ status: 401, body: { message: 'Unauthorized!' } });
    await expect(validateMagicalApiKey({ apiKey: 'bad' })).resolves.toEqual({ valid: false, error: 'Invalid API key.' });
  });

  it('surfaces 402 plan restriction honestly', async () => {
    respondWith({ status: 402, body: { message: 'API access not available for this plan.' } });
    const result = await validateMagicalApiKey({ apiKey: 'k' });
    expect(result.valid).toBe(false);
    if (result.valid) return;
    expect(result.error).toContain('402');
    expect(result.error).not.toBe('Invalid API key.');
  });

  it('surfaces 5xx as a non-auth failure', async () => {
    respondWith({ status: 503, body: 'down' });
    const result = await validateMagicalApiKey({ apiKey: 'k' });
    expect(result.valid).toBe(false);
    if (result.valid) return;
    expect(result.error).toContain('server error');
  });

  it('rejects an empty key without a request', async () => {
    await expect(validateMagicalApiKey({ apiKey: '  ' })).resolves.toMatchObject({ valid: false });
    expect(requests).toHaveLength(0);
  });
});

describe('runJob', () => {
  it('returns immediately when the first response is finished', async () => {
    respondWith({ status: 200, body: { data: { basic: { first_name: 'Ann' } } } });
    const data = await runJob({ apiKey: 'k', service: 'resume_parser', input: { url: 'https://x.io/a.pdf' }, requestId: undefined, sleep: noSleep });
    expect(data).toEqual({ basic: { first_name: 'Ann' } });
    expect(requests[0].body).toEqual({ url: 'https://x.io/a.pdf' });
  });

  it('polls the same endpoint with the returned request_id until ready', async () => {
    respondWith(
      { status: 201, body: { data: { request_id: 'abc' } } },
      { status: 200, body: { data: { request_id: 'abc' } } },
      { status: 200, body: { data: { score: 80, summary: 's' } } },
    );
    const data = await runJob({ apiKey: 'k', service: 'resume_score', input: { url: 'u', job_description: 'jd' }, requestId: undefined, sleep: noSleep });
    expect(data).toEqual({ score: 80, summary: 's' });
    expect(requests.map((r) => r.url)).toEqual(Array(3).fill('https://gw.magicalapi.com/resume-score'));
    expect(requests[1].body).toEqual({ request_id: 'abc' });
  });

  it('resumes with a given request_id without starting a new job', async () => {
    respondWith({ status: 200, body: { data: { company_name: 'microsoft' } } });
    await runJob({ apiKey: 'k', service: 'company_data', input: { company_name: 'Microsoft' }, requestId: ' r9 ', sleep: noSleep });
    expect(requests).toHaveLength(1);
    expect(requests[0].body).toEqual({ request_id: 'r9' });
  });

  it('rejects a whitespace-only request_id before any request', async () => {
    respondWith({ status: 201, body: { data: { request_id: 'new-paid-job' } } });
    await expect(
      runJob({ apiKey: 'k', service: 'resume_parser', input: { url: 'https://x.io/a.pdf' }, requestId: '   ', sleep: noSleep }),
    ).rejects.toThrow('Request ID is blank');
    expect(requests).toHaveLength(0);
  });

  it('every new-job action rejects a whitespace-only request_id even with valid new-job inputs', async () => {
    respondWith({ status: 201, body: { data: { request_id: 'new-paid-job' } } });
    const auth: { type: AppConnectionType.SECRET_TEXT; secret_text: string } = { type: AppConnectionType.SECRET_TEXT, secret_text: 'k' };
    const url = 'https://x.io/a.pdf';
    const request_id = '   ';
    const runs = [
      () => parseResume.run({ ...createMockActionContext<typeof parseResume.props>({ propsValue: { url, request_id } }), auth }),
      () => reviewResume.run({ ...createMockActionContext<typeof reviewResume.props>({ propsValue: { url, request_id } }), auth }),
      () => scoreResume.run({ ...createMockActionContext<typeof scoreResume.props>({ propsValue: { url, job_description: 'jd', request_id } }), auth }),
      () => getProfileData.run({ ...createMockActionContext<typeof getProfileData.props>({ propsValue: { profile_name: 'satyanadella', request_id } }), auth }),
      () =>
        getCompanyData.run({
          ...createMockActionContext<typeof getCompanyData.props>({
            propsValue: { company_name: 'Microsoft', company_username: undefined, company_website: undefined, request_id },
          }),
          auth,
        }),
    ];
    for (const run of runs) {
      await expect(run()).rejects.toThrow('Request ID is blank');
    }
    expect(requests).toHaveLength(0);
  });

  it('times out with the Request ID after the attempt budget', async () => {
    respondWith({ status: 201, body: { data: { request_id: 'slow' } } });
    await expect(
      runJob({ apiKey: 'k', service: 'profile_data', input: { profile_name: 'x' }, requestId: undefined, sleep: noSleep }),
    ).rejects.toThrow('Request ID slow');
    expect(requests).toHaveLength(POLL_MAX_ATTEMPTS + 1);
  });

  it('fails clearly when neither request_id nor result comes back', async () => {
    respondWith({ status: 200, body: { data: {} } });
    await expect(
      runJob({ apiKey: 'k', service: 'resume_review', input: { url: 'u' }, requestId: undefined, sleep: noSleep }),
    ).rejects.toThrow('did not return a Request ID');
  });

  it('keeps vendor error status during polling', async () => {
    respondWith({ status: 201, body: { data: { request_id: 'abc' } } }, { status: 500, body: { message: 'File format not Acceptable' } });
    const error = await runJob({ apiKey: 'k', service: 'resume_parser', input: { url: 'u' }, requestId: undefined, sleep: noSleep }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(MagicalApiError);
    expect(String(error)).toContain('File format not Acceptable');
  });
});

describe('fetchJobResult', () => {
  it('reports processing with the request id', async () => {
    respondWith({ status: 201, body: { data: { request_id: 'abc' } } });
    await expect(fetchJobResult({ apiKey: 'k', service: 'profile_data', requestId: 'abc' })).resolves.toEqual({
      status: 'processing',
      request_id: 'abc',
      data: { request_id: 'abc' },
    });
    expect(requests).toHaveLength(1);
  });

  it('reports ready with data', async () => {
    respondWith({ status: 200, body: { data: { profile: 'williamhgates', name: 'Bill' } } });
    const result = await fetchJobResult({ apiKey: 'k', service: 'profile_data', requestId: 'abc' });
    expect(result).toEqual({ status: 'ready', request_id: 'abc', data: { profile: 'williamhgates', name: 'Bill' } });
  });
});

describe('toProfileSlug', () => {
  it.each([
    ['williamhgates', 'williamhgates'],
    ['https://www.linkedin.com/in/williamhgates/', 'williamhgates'],
    ['linkedin.com/in/jane-doe?trk=x', 'jane-doe'],
    ['  @someone/ ', 'someone'],
  ])('%s -> %s', (input, expected) => {
    expect(toProfileSlug(input)).toBe(expected);
  });
});

describe('piece metadata', () => {
  it('every non-custom action has outputSchema, classification and aiMetadata', () => {
    const actions = Object.values(magicalApi.actions());
    const named = actions.filter((a) => a.name !== 'custom_api_call');
    expect(named).toHaveLength(6);
    for (const action of named) {
      expect(action.outputSchema, action.name).toBeDefined();
      expect(action.classification, action.name).toBeDefined();
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
    }
    expect(actions.find((a) => a.name === 'get_job_result')?.audience).toBe('ai');
  });
});

describe('live-captured shapes', () => {
  it('treats a 201 running poll as processing', async () => {
    const running = { status: 'running', message: 'result is not ready yet, try again in a while.', request_id: 'abc' };
    respondWith({ status: 201, body: { data: running, usage: { credits: 0 } } });
    await expect(fetchJobResult({ apiKey: 'k', service: 'company_data', requestId: 'abc' })).resolves.toEqual({
      status: 'processing',
      request_id: 'abc',
      data: running,
    });
  });

  it('distinguishes an unknown Request ID from a lookup that found nothing', async () => {
    respondWith({ status: 404, body: { message: 'request id not found!' } });
    const unknown = await fetchJobResult({ apiKey: 'k', service: 'profile_data', requestId: 'x' }).catch((e: unknown) => e);
    expect(String(unknown)).toContain('fetched only once');
    respondWith({ status: 404, body: { message: 'LinkedIn page not found for this company!', usage: { credits: -150 } } });
    const notFound = await fetchJobResult({ apiKey: 'k', service: 'company_data', requestId: 'x' }).catch((e: unknown) => e);
    expect(String(notFound)).toContain('LinkedIn page not found');
    expect(String(notFound)).not.toContain('fetched only once');
  });
});
