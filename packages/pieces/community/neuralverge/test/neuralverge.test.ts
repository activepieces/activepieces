import { HttpError, HttpMethod, HttpRequest, HttpResponse, httpClient } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { neuralverge } from '../src';
import { neuralvergeAuth } from '../src/lib/auth';
import { neuralvergeClient } from '../src/lib/common/client';
import { runResearchAction } from '../src/lib/actions/run-research';
import { getResearchStatusAction } from '../src/lib/actions/get-research-status';
import { searchWebAction } from '../src/lib/actions/search-web';
import { extractFromUrlAction } from '../src/lib/actions/extract-from-url';
import { getLinkedinProfileWithEmailAction } from '../src/lib/actions/get-linkedin-profile-with-email';
import { findLinkedinProfileAction } from '../src/lib/actions/find-linkedin-profile';
import { searchLinkedinCompaniesAction } from '../src/lib/actions/search-linkedin-companies';
import { searchLinkedinPeopleAction } from '../src/lib/actions/search-linkedin-people';
import { listCompanyEmployeesAction } from '../src/lib/actions/list-company-employees';
import { findPersonByEmailAction } from '../src/lib/actions/find-person-by-email';
import { verifyEmailAction } from '../src/lib/actions/verify-email';
import { findEmailByNameAction } from '../src/lib/actions/find-email-by-name';
import { findPersonByPhoneAction } from '../src/lib/actions/find-person-by-phone';
import { findPersonByUsPhoneAction } from '../src/lib/actions/find-person-by-us-phone';
import { getCompanyFundingAction } from '../src/lib/actions/get-company-funding';
import { searchAmazonProductsAction } from '../src/lib/actions/search-amazon-products';
import { getAmazonProductAction } from '../src/lib/actions/get-amazon-product';
import { getAmazonBuyBoxOfferAction } from '../src/lib/actions/get-amazon-buy-box-offer';
import { getAmazonSellerAction } from '../src/lib/actions/get-amazon-seller';
import { listAmazonSellerProductsAction } from '../src/lib/actions/list-amazon-seller-products';

const API_KEY = 'sk_test_key';
const BASE = 'https://api.neuralverge.ai/functions/v1';

const CASES = [
  { action: runResearchAction, endpoint: 'run-research', method: 'POST', props: {"instructions": "x", "wait_for_completion": false} },
  { action: getResearchStatusAction, endpoint: 'get-session-status', method: 'GET', props: {"session_id": "x"} },
  { action: searchWebAction, endpoint: 'run-search', method: 'POST', props: {"query": "x"} },
  { action: extractFromUrlAction, endpoint: 'run-extract', method: 'POST', props: {"url": "x", "instructions": "x"} },
  { action: getLinkedinProfileWithEmailAction, endpoint: 'run-linkedin-email', method: 'POST', props: {"profile_url": "x"} },
  { action: findLinkedinProfileAction, endpoint: 'run-linkedin-domain', method: 'POST', props: {"full_name": "x", "company_or_domain": "x"} },
  { action: searchLinkedinCompaniesAction, endpoint: 'run-linkedin-company-search', method: 'POST', props: {"search_query": "x"} },
  { action: searchLinkedinPeopleAction, endpoint: 'run-linkedin-people-search', method: 'POST', props: {} },
  { action: listCompanyEmployeesAction, endpoint: 'run-linkedin-company-employee', method: 'POST', props: {"companies": ["https://www.linkedin.com/company/example/"]} },
  { action: findPersonByEmailAction, endpoint: 'run-email-enrichment', method: 'POST', props: {"email": "x"} },
  { action: verifyEmailAction, endpoint: 'run-email-validation', method: 'POST', props: {"email": "x"} },
  { action: findEmailByNameAction, endpoint: 'run-email-finder', method: 'POST', props: {"first_name": "x", "last_name": "x", "domain": "x"} },
  { action: findPersonByPhoneAction, endpoint: 'run-phone-enrichment', method: 'POST', props: {"phone": "x"} },
  { action: findPersonByUsPhoneAction, endpoint: 'run-phone-enrichment-us', method: 'POST', props: {"phone": "x"} },
  { action: getCompanyFundingAction, endpoint: 'run-crunchbase-company', method: 'POST', props: {"url": "x"} },
  { action: searchAmazonProductsAction, endpoint: 'run-amazon-product-search', method: 'POST', props: {"query": "x"} },
  { action: getAmazonProductAction, endpoint: 'run-amazon-product', method: 'POST', props: {"asin": "x"} },
  { action: getAmazonBuyBoxOfferAction, endpoint: 'run-amazon-product-offers', method: 'POST', props: {"asin": "x"} },
  { action: getAmazonSellerAction, endpoint: 'run-amazon-seller', method: 'POST', props: {"seller": "x"} },
  { action: listAmazonSellerProductsAction, endpoint: 'run-amazon-seller-products', method: 'POST', props: {"seller": "x"} },
];

type RunnableAction = { run: (ctx: never) => Promise<unknown> };

function resp(body: unknown): HttpResponse {
  return { status: 200, headers: {}, body };
}

function ctx(propsValue: Record<string, unknown>): never {
  return { auth: { type: 'SECRET_TEXT', secret_text: API_KEY }, propsValue } as never;
}

function run(action: unknown, propsValue: Record<string, unknown>): Promise<unknown> {
  return (action as RunnableAction).run(ctx(propsValue));
}

let sendRequest: MockInstance<typeof httpClient.sendRequest>;

function calls(): HttpRequest[] {
  return sendRequest.mock.calls.map((c) => c[0] as HttpRequest);
}

beforeEach(() => {
  sendRequest = vi.spyOn(httpClient, 'sendRequest');
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('piece definition', () => {
  it('exposes 20 endpoint actions plus the custom API call', () => {
    const names = Object.keys(neuralverge.actions());
    expect(names).toHaveLength(21);
    expect(names).toContain('custom_api_call');
  });

  it('tags every hand-written action with AI metadata', () => {
    for (const { action } of CASES) {
      expect(action.audience).toBe('both');
      expect(action.aiMetadata?.description).toBeTruthy();
      expect(action.classification).toBeTruthy();
    }
  });
});

describe('auth', () => {
  it('validates the key with the email verification call', async () => {
    sendRequest.mockResolvedValue(resp({ session_id: 's', total_points: 1 }));
    const result = await neuralvergeAuth.validate?.({ auth: API_KEY, server: {} } as never);
    expect(result).toEqual({ valid: true });
    const [req] = calls();
    expect(req.method).toBe(HttpMethod.POST);
    expect(req.url).toBe(`${BASE}/run-email-validation`);
    expect(req.headers?.['x-api-key']).toBe(API_KEY);
    expect(req.headers?.['Authorization']).toBeUndefined();
    expect(req.body).toEqual({ email: 'test@example.com' });
  });

  it('rejects a key that returns 401', async () => {
    sendRequest.mockRejectedValue(new HttpError({}, { status: 401, responseBody: { error: 'Unauthorized' } }));
    const result = await neuralvergeAuth.validate?.({ auth: 'bad', server: {} } as never);
    expect(result?.valid).toBe(false);
  });
});

describe('endpoint routing', () => {
  it.each(CASES)('$endpoint', async ({ action, endpoint, method, props }) => {
    sendRequest.mockResolvedValue(resp({ session_id: 's1', status: 'complete' }));
    await run(action, props);
    const [req] = calls();
    expect(req.headers?.['x-api-key']).toBe(API_KEY);
    if (method === 'GET') {
      expect(req.method).toBe(HttpMethod.GET);
      expect(req.url).toBe(`${BASE}/${endpoint}`);
      expect(req.queryParams).toEqual({ session_id: 'x' });
    } else {
      expect(req.method).toBe(HttpMethod.POST);
      expect(req.url).toBe(`${BASE}/${endpoint}`);
    }
  });
});

describe('request bodies', () => {
  it('drops empty optional fields and keeps required settings', async () => {
    sendRequest.mockResolvedValue(resp({ session_id: 's1' }));
    await run(extractFromUrlAction, { url: 'https://example.com', instructions: 'Get the name', country_code: '', extract_schema_json: '' });
    expect(calls()[0].body).toEqual({ url: 'https://example.com', instructions: 'Get the name', settings: {} });
  });

  it('nests settings and stringifies the JSON schema', async () => {
    sendRequest.mockResolvedValue(resp({ session_id: 's1' }));
    await run(searchWebAction, { query: 'Example Inc. pricing', country: 'us', language: 'en', max_results: 5 });
    expect(calls()[0].body).toEqual({ query: 'Example Inc. pricing', settings: { country: 'us', language: 'en', max_results: 5 } });
  });

  it('maps LinkedIn profile URL to username and trims list filters', async () => {
    sendRequest.mockResolvedValue(resp({ session_id: 's1' }));
    await run(getLinkedinProfileWithEmailAction, { profile_url: 'https://www.linkedin.com/in/janedoe/', include_email: true });
    expect(calls()[0].body).toEqual({ username: 'https://www.linkedin.com/in/janedoe/', includeEmail: true });
    await run(searchLinkedinPeopleAction, { search_query: 'recruiter', locations: [' Amsterdam ', ''], current_company: [] });
    expect(calls()[1].body).toEqual({ searchQuery: 'recruiter', locations: ['Amsterdam'] });
  });

  it('sends Amazon marketplace and paging fields in snake_case', async () => {
    sendRequest.mockResolvedValue(resp({ session_id: 's1' }));
    await run(searchAmazonProductsAction, { query: 'wireless mouse', domain: 'amazon.com', max_items: 2, start_page: 1 });
    expect(calls()[0].body).toEqual({ query: 'wireless mouse', domain: 'amazon.com', max_items: 2, start_page: 1 });
  });

  it('rejects an invalid JSON schema string', () => {
    expect(() => neuralvergeClient.toSchemaString('{not json')).toThrow();
    expect(neuralvergeClient.toSchemaString({ type: 'object' })).toBe('{"type":"object"}');
  });
});

describe('research polling', () => {
  it('polls get-session-status every 3 s until complete', async () => {
    vi.useFakeTimers();
    sendRequest
      .mockResolvedValueOnce(resp({ session_id: 'r1' }))
      .mockResolvedValueOnce(resp({ session_id: 'r1', status: 'queued' }))
      .mockResolvedValueOnce(resp({ session_id: 'r1', status: 'running' }))
      .mockResolvedValueOnce(resp({ session_id: 'r1', status: 'complete', results: { human: '# Report', total_points: 50 } }));
    const pending = run(runResearchAction, { instructions: 'Analyze Example Inc.', search_enabled: true, wait_for_completion: true, timeout_seconds: 60 });
    await vi.advanceTimersByTimeAsync(6000);
    const result = await pending;
    expect(result).toMatchObject({ status: 'complete', results: { total_points: 50 } });
    const reqs = calls();
    expect(reqs).toHaveLength(4);
    expect(reqs[0].url).toBe(`${BASE}/run-research`);
    expect(reqs[0].body).toEqual({ instructions: 'Analyze Example Inc.', settings: { search_enabled: true } });
    expect(reqs.slice(1).every((r) => r.url === `${BASE}/get-session-status` && r.queryParams?.['session_id'] === 'r1')).toBe(true);
  });

  it('throws when the research task fails', async () => {
    sendRequest
      .mockResolvedValueOnce(resp({ session_id: 'r2' }))
      .mockResolvedValueOnce(resp({ session_id: 'r2', status: 'failed', results: { error: 'upstream' } }));
    await expect(run(runResearchAction, { instructions: 'x', timeout_seconds: 60 })).rejects.toThrow(/failed/);
  });

  it('returns the running status with timed_out when the wait expires', async () => {
    sendRequest.mockResolvedValue(resp({ session_id: 'r3', status: 'running' }));
    const result = await neuralvergeClient.waitForSession({ apiKey: API_KEY, sessionId: 'r3', timeoutSeconds: 0 });
    expect(result).toMatchObject({ status: 'running', timed_out: true });
  });
});

describe('errors', () => {
  it('explains a 401 and a 402', async () => {
    sendRequest.mockRejectedValueOnce(new HttpError({}, { status: 401, responseBody: { error: 'Unauthorized' } }));
    await expect(run(verifyEmailAction, { email: 'jane.doe@example.com' })).rejects.toThrow(/Invalid NeuralVerge API key/);
    sendRequest.mockRejectedValueOnce(new HttpError({}, { status: 402, responseBody: { error: 'limit' } }));
    await expect(run(verifyEmailAction, { email: 'jane.doe@example.com' })).rejects.toThrow(/points limit/);
  });
});
