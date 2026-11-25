import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import {
  captainDataClient,
  captainDataUtils,
  CaptainDataError,
} from '../src/lib/common';
import { findCompany } from '../src/lib/actions/find-company';
import { launchWorkflow } from '../src/lib/actions/launch-workflow';
import { getJobResults } from '../src/lib/actions/get-job-results';
import { searchPeople } from '../src/lib/actions/search-people';
import { listPersonSkills } from '../src/lib/actions/list-person-skills';
import { captainDataAuth } from '../src/lib/auth';
import { searchCompanies } from '../src/lib/actions/search-companies';
import { enrichPerson } from '../src/lib/actions/enrich-person';
import { enrichCompany } from '../src/lib/actions/enrich-company';
import { findPerson } from '../src/lib/actions/find-person';
import { listPersonExperiences } from '../src/lib/actions/list-person-experiences';
import { listPersonCertifications } from '../src/lib/actions/list-person-certifications';
import { findCompanyEmployees } from '../src/lib/actions/find-company-employees';
import { getQuotas } from '../src/lib/actions/get-quotas';
import { captainData } from '../src';
import {
  AppConnectionType,
  createMockActionContext,
} from '@activepieces/pieces-framework';

const API_KEY = 'test-key-123';

const AUTH = {
  type: AppConnectionType.CUSTOM_AUTH,
  props: { apiKey: API_KEY, projectId: '' },
};

function makeContext<P extends Record<string, unknown>>({
  propsValue,
}: {
  propsValue: P;
}) {
  return { ...createMockActionContext({ propsValue }), auth: AUTH };
}

function validateParams({ apiKey }: { apiKey: string }) {
  return {
    auth: { apiKey, projectId: 'legacy' },
    server: {
      apiUrl: 'http://localhost/api',
      publicUrl: 'http://localhost',
      mintOidcToken: async () => 'token',
    },
  };
}

function httpError({ status, body }: { status: number; body: unknown }) {
  return Object.assign(new Error('http'), { response: { status, body } });
}

describe('captain-data', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseNextCursor', () => {
    it('reads cursor from an absolute URL', () => {
      expect(
        captainDataUtils.parseNextCursor({
          header:
            'https://api.captaindata.com/v1/people/search?query=x&cursor=abc%3D',
        })
      ).toBe('abc=');
    });
    it('reads cursor from a relative URL', () => {
      expect(
        captainDataUtils.parseNextCursor({
          header: '/v1/people/search?cursor=next1',
        })
      ).toBe('next1');
    });
    it('returns null when the header is absent', () => {
      expect(
        captainDataUtils.parseNextCursor({ header: undefined })
      ).toBeNull();
      expect(
        captainDataUtils.parseNextCursor({ header: '/v1/x?query=a' })
      ).toBeNull();
    });
  });

  describe('request shape', () => {
    it('sends X-API-Key, Accept and omits empty query params', async () => {
      const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
        status: 200,
        headers: {
          'x-pagination-next':
            'https://api.captaindata.com/v1/people/search?cursor=c2',
        },
        body: [{ uid: 'p1' }],
      });
      const result = await searchPeople.run(
        makeContext({
          propsValue: { query: ' (keywords:cto) ', cursor: '' },
        })
      );
      const req = spy.mock.calls[0][0];
      expect(req.url).toBe('https://api.captaindata.com/v1/people/search');
      expect(req.headers).toEqual({
        'X-API-Key': API_KEY,
        Accept: 'application/json',
      });
      expect(req.queryParams).toEqual({ query: '(keywords:cto)' });
      expect(result).toEqual({
        items: [{ uid: 'p1' }],
        next_cursor: 'c2',
        has_more: true,
      });
    });
  });

  describe('errors', () => {
    it('maps the nested 429 shape and keeps responseBody', async () => {
      const body = {
        error: {
          code: 429,
          status: 'Too Many Requests',
          details: { 'Retry-After': '30' },
        },
      };
      vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
        httpError({ status: 429, body })
      );
      const error = await captainDataClient
        .request({ apiKey: API_KEY, path: '/quotas', operation: 'get quotas' })
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(CaptainDataError);
      expect(error).toMatchObject({
        message:
          'Captain Data get quotas failed (429): Too Many Requests, retry after 30 seconds',
        status: 429,
        responseBody: body,
      });
      expect(error).not.toHaveProperty('body');
      expect(error instanceof Error ? error.message : '').not.toContain(
        API_KEY
      );
    });
    it('maps the standard error body', async () => {
      vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
        httpError({
          status: 400,
          body: { error_label: 'INVALID_INPUT', message: 'bad domain' },
        })
      );
      await expect(
        captainDataClient.request({
          apiKey: API_KEY,
          path: '/companies/find',
          operation: 'find company',
        })
      ).rejects.toThrow(
        'Captain Data find company failed (400): INVALID_INPUT: bad domain'
      );
    });
  });

  describe('nested error message', () => {
    it('includes nested message when present', async () => {
      vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
        httpError({
          status: 404,
          body: {
            error: { code: 404, status: 'Not Found', message: 'no company' },
          },
        })
      );
      await expect(
        captainDataClient.request({
          apiKey: API_KEY,
          path: '/companies/1/employees',
          operation: 'find company employees',
        })
      ).rejects.toThrow(
        'Captain Data find company employees failed (404): Not Found: no company'
      );
    });
  });

  describe('search query hint', () => {
    it('appends the Sales Navigator syntax hint on a 424 search error', async () => {
      vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
        httpError({
          status: 424,
          body: {
            error_label: 'GENERIC_ERROR',
            message: 'request payload is not valid',
          },
        })
      );
      await expect(
        searchPeople.run(makeContext({ propsValue: { query: 'garbage!!!' } }))
      ).rejects.toThrow(
        'Captain Data search people failed (424): GENERIC_ERROR: request payload is not valid. The query must use Sales Navigator filter syntax, for example (keywords:CEO). If you passed a cursor, it may have expired (cursors last 24 hours); start again without it.'
      );
    });
    it('does not append the hint on other statuses', async () => {
      vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
        httpError({ status: 500, body: { message: 'boom' } })
      );
      const error = await searchPeople
        .run(makeContext({ propsValue: { query: '(keywords:CEO)' } }))
        .catch((e: unknown) => e);
      expect(String(error)).not.toContain('Sales Navigator');
    });
  });

  describe('find company validation', () => {
    it('rejects both domain and company name before any request', async () => {
      const spy = vi.spyOn(httpClient, 'sendRequest');
      await expect(
        findCompany.run(
          makeContext({
            propsValue: { domain: 'a.com', company_name: 'A' },
          })
        )
      ).rejects.toThrow('not both');
      expect(spy).not.toHaveBeenCalled();
    });
    it('rejects neither before any request', async () => {
      const spy = vi.spyOn(httpClient, 'sendRequest');
      await expect(
        findCompany.run(
          makeContext({
            propsValue: { domain: ' ', company_name: '' },
          })
        )
      ).rejects.toThrow('Provide a Domain or a Company Name.');
      expect(spy).not.toHaveBeenCalled();
    });
    it('sends only the domain', async () => {
      const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
        status: 200,
        headers: {},
        body: { uid: 'c1' },
      });
      await findCompany.run(
        makeContext({ propsValue: { domain: 'activepieces.com' } })
      );
      expect(spy.mock.calls[0][0].queryParams).toEqual({
        domain: 'activepieces.com',
      });
    });
  });

  describe('deprecated actions', () => {
    it('throw the migration error without a network call', async () => {
      const spy = vi.spyOn(httpClient, 'sendRequest');
      await expect(
        launchWorkflow.run(makeContext({ propsValue: {} }))
      ).rejects.toThrow('shut down on 2026-01-09');
      await expect(
        getJobResults.run(makeContext({ propsValue: {} }))
      ).rejects.toThrow('shut down on 2026-01-09');
      expect(spy).not.toHaveBeenCalled();
      expect(launchWorkflow.audience).toBe('human');
      expect(getJobResults.name).toBe('getJobResults');
    });
  });
  describe('qa edge cases', () => {
    it('validate returns invalid on 401 and does not echo the key', async () => {
      const spy = vi
        .spyOn(httpClient, 'sendRequest')
        .mockRejectedValue(httpError({ status: 401, body: { message: 'no' } }));
      const result = await captainDataAuth.validate?.(
        validateParams({ apiKey: API_KEY })
      );
      expect(result).toEqual({
        valid: false,
        error: 'Invalid Captain Data API key.',
      });
      expect(spy.mock.calls[0][0].url).toBe(
        'https://api.captaindata.com/v1/quotas'
      );
      expect(spy.mock.calls[0][0].headers).toMatchObject({
        'X-API-Key': API_KEY,
      });
    });
    it('validate returns valid on 200 with a legacy projectId', async () => {
      vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
        status: 200,
        headers: {},
        body: { credits_left: 5 },
      });
      const result = await captainDataAuth.validate?.(
        validateParams({ apiKey: API_KEY })
      );
      expect(result).toEqual({ valid: true });
    });
    it('rejects a non-array list body with responseBody', async () => {
      vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
        status: 200,
        headers: {},
        body: { data: [] },
      });
      const error = await searchPeople
        .run(makeContext({ propsValue: { query: 'x' } }))
        .catch((e: unknown) => e);
      expect(error).toMatchObject({
        message:
          'Captain Data search people failed: expected a list in the response.',
        responseBody: { data: [] },
      });
    });
    it('returns has_more false without a next header', async () => {
      vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
        status: 200,
        headers: {},
        body: [],
      });
      const result = await searchPeople.run(
        makeContext({ propsValue: { query: 'x', cursor: 'c1' } })
      );
      expect(result).toEqual({ items: [], next_cursor: null, has_more: false });
    });
    it('maps a timeout to a vendor-prefixed message', async () => {
      vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
        Object.assign(new Error('aborted'), { name: 'AbortError' })
      );
      await expect(
        captainDataClient.request({
          apiKey: API_KEY,
          path: '/quotas',
          operation: 'get quotas',
        })
      ).rejects.toThrow(
        'Captain Data get quotas failed: the request timed out'
      );
    });
    it('person lookup requires exactly one identifier before any request', async () => {
      const spy = vi.spyOn(httpClient, 'sendRequest');
      await expect(
        listPersonSkills.run(
          makeContext({
            propsValue: { people_uid: 'u1', li_profile_url: 'https://x' },
          })
        )
      ).rejects.toThrow('not both');
      await expect(
        listPersonSkills.run(makeContext({ propsValue: {} }))
      ).rejects.toThrow('Provide a Person UID');
      expect(spy).not.toHaveBeenCalled();
    });
  });
});

const BASE = 'https://api.captaindata.com/v1';
const HEADERS = { 'X-API-Key': API_KEY, Accept: 'application/json' };

function mockResponse({
  body,
  headers = {},
}: {
  body: unknown;
  headers?: Record<string, string>;
}) {
  return vi
    .spyOn(httpClient, 'sendRequest')
    .mockResolvedValue({ status: 200, headers, body });
}

function sentRequest({ spy }: { spy: ReturnType<typeof mockResponse> }) {
  expect(spy).toHaveBeenCalledTimes(1);
  const req = spy.mock.calls[0][0];
  return {
    method: req.method,
    url: req.url,
    queryParams: req.queryParams,
    headers: req.headers,
  };
}

describe('captain-data action requests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    { action: searchPeople, path: '/people/search' },
    { action: searchCompanies, path: '/companies/search' },
  ])(
    '$path sends query and cursor and maps pagination',
    async ({ action, path }) => {
      const items = [{ uid: 'a', extracted_at: '2026-11-25T00:00:00Z' }];
      const spy = mockResponse({
        body: items,
        headers: {
          'X-Pagination-Next': `${BASE}${path}?query=x&cursor=NEXT%2B1`,
        },
      });
      const result = await action.run(
        makeContext({
          propsValue: { query: '(keywords:CEO)', cursor: 'PREV' },
        })
      );
      expect(sentRequest({ spy })).toEqual({
        method: 'GET',
        url: `${BASE}${path}`,
        queryParams: { query: '(keywords:CEO)', cursor: 'PREV' },
        headers: HEADERS,
      });
      expect(result).toEqual({ items, next_cursor: 'NEXT+1', has_more: true });
    }
  );

  it('search_people prefers the X-Cursor-Next header when present', async () => {
    mockResponse({
      body: [],
      headers: {
        'X-Cursor-Next': 'RAW_CURSOR',
        'X-Pagination-Next': `${BASE}/people/search?query=x&cursor=OLD`,
      },
    });
    const result = await searchPeople.run(
      makeContext({ propsValue: { query: '(keywords:CEO)' } })
    );
    expect(result).toEqual({
      items: [],
      next_cursor: 'RAW_CURSOR',
      has_more: true,
    });
  });

  it.each([
    { label: 'blank', value: '   ', expected: 'OLD' },
    {
      label: 'URL-shaped',
      value: `${BASE}/people/search?query=x&cursor=FROMURL`,
      expected: 'FROMURL',
    },
  ])(
    'search_people handles a $label X-Cursor-Next header',
    async ({ value, expected }) => {
      mockResponse({
        body: [],
        headers: {
          'X-Cursor-Next': value,
          'X-Pagination-Next': `${BASE}/people/search?query=x&cursor=OLD`,
        },
      });
      const result = await searchPeople.run(
        makeContext({ propsValue: { query: '(keywords:CEO)' } })
      );
      expect(result).toEqual({
        items: [],
        next_cursor: expected,
        has_more: true,
      });
    }
  );

  it('search_companies last page has no cursor', async () => {
    const spy = mockResponse({ body: [] });
    const result = await searchCompanies.run(
      makeContext({ propsValue: { query: '(keywords:x)' } })
    );
    expect(sentRequest({ spy }).queryParams).toEqual({ query: '(keywords:x)' });
    expect(result).toEqual({ items: [], next_cursor: null, has_more: false });
  });

  it.each([
    { full_enrich: true, sent: 'true' },
    { full_enrich: false, sent: 'false' },
    { full_enrich: undefined, sent: 'false' },
  ])(
    'enrich_person full_enrich=$full_enrich sends $sent',
    async ({ full_enrich, sent }) => {
      const body = {
        uid: 'p1',
        full_name: 'Jane Doe',
        education: [{ degree_name: 'BSc' }],
      };
      const spy = mockResponse({ body });
      const result = await enrichPerson.run(
        makeContext({
          propsValue: {
            li_profile_url: ' https://www.linkedin.com/in/jane ',
            full_enrich,
          },
        })
      );
      expect(sentRequest({ spy })).toEqual({
        method: 'GET',
        url: `${BASE}/people/enrich`,
        queryParams: {
          li_profile_url: 'https://www.linkedin.com/in/jane',
          full_enrich: sent,
        },
        headers: HEADERS,
      });
      expect(result).toEqual(body);
    }
  );

  it('enrich_company sends the URL and returns the schema fields', async () => {
    const schemaKeys = (enrichCompany.outputSchema?.fields ?? []).map(
      (f) => f.key
    );
    const body = Object.fromEntries(schemaKeys.map((k) => [k, `v-${k}`]));
    const spy = mockResponse({ body });
    const result = await enrichCompany.run(
      makeContext({
        propsValue: {
          li_company_url: 'https://www.linkedin.com/company/captaindata',
        },
      })
    );
    expect(sentRequest({ spy })).toEqual({
      method: 'GET',
      url: `${BASE}/companies/enrich`,
      queryParams: {
        li_company_url: 'https://www.linkedin.com/company/captaindata',
      },
      headers: HEADERS,
    });
    expect(schemaKeys).toEqual(
      expect.arrayContaining([
        'number_employees',
        'employees_range',
        'li_followers_count',
        'specialties',
        'extracted_at',
      ])
    );
    expect(result).toEqual(body);
  });

  it.each([
    {
      props: { full_name: 'Jane Doe', company_name: 'Acme' },
      query: { full_name: 'Jane Doe', company_name: 'Acme' },
    },
    {
      props: { full_name: 'Jane Doe', company_name: '' },
      query: { full_name: 'Jane Doe' },
    },
  ])('find_person sends $query', async ({ props, query }) => {
    const body = {
      uid: 'p1',
      li_profile_url: 'https://www.linkedin.com/in/jane',
      li_profile_id: 1,
    };
    const spy = mockResponse({ body });
    const result = await findPerson.run(makeContext({ propsValue: props }));
    expect(sentRequest({ spy })).toEqual({
      method: 'GET',
      url: `${BASE}/people/find`,
      queryParams: query,
      headers: HEADERS,
    });
    expect(result).toEqual(body);
  });

  it('find_person rejects an empty name before any request', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(
      findPerson.run(makeContext({ propsValue: { full_name: ' ' } }))
    ).rejects.toThrow('Full Name is required.');
    expect(spy).not.toHaveBeenCalled();
  });

  describe.each([
    {
      action: listPersonExperiences,
      path: '/people/experiences',
      paged: false,
    },
    { action: listPersonSkills, path: '/people/skills', paged: false },
    {
      action: listPersonCertifications,
      path: '/people/certifications',
      paged: true,
    },
  ])('$path', ({ action, path, paged }) => {
    it.each([
      { props: { people_uid: 'uid-1' }, query: { people_uid: 'uid-1' } },
      {
        props: { li_profile_url: 'https://www.linkedin.com/in/jane' },
        query: { li_profile_url: 'https://www.linkedin.com/in/jane' },
      },
    ])('sends $query', async ({ props, query }) => {
      const items = [{ title: 't' }];
      const spy = mockResponse({ body: items });
      const result = await action.run(makeContext({ propsValue: props }));
      expect(sentRequest({ spy })).toEqual({
        method: 'GET',
        url: `${BASE}${path}`,
        queryParams: query,
        headers: HEADERS,
      });
      expect(result).toEqual(
        paged ? { items, next_cursor: null, has_more: false } : { items }
      );
    });
  });

  it('find_company_employees puts the LinkedIn company ID in the path with query and cursor', async () => {
    const items = [{ uid: 'e1' }];
    const spy = mockResponse({
      body: items,
      headers: {
        'x-pagination-next': '/v1/companies/27193685/employees?cursor=C2',
      },
    });
    const result = await findCompanyEmployees.run(
      makeContext({
        propsValue: {
          company_id: ' 27193685 ',
          query: '(keywords:CEO)',
          cursor: 'C1',
        },
      })
    );
    expect(sentRequest({ spy })).toEqual({
      method: 'GET',
      url: `${BASE}/companies/27193685/employees`,
      queryParams: { query: '(keywords:CEO)', cursor: 'C1' },
      headers: HEADERS,
    });
    expect(result).toEqual({ items, next_cursor: 'C2', has_more: true });
  });

  it('find_company_employees omits an empty query and encodes the path', async () => {
    const spy = mockResponse({ body: [] });
    await findCompanyEmployees.run(
      makeContext({ propsValue: { company_id: '../x', query: '' } })
    );
    const req = sentRequest({ spy });
    expect(req.url).toBe(`${BASE}/companies/..%2Fx/employees`);
    expect(req.queryParams).toEqual({});
  });

  it('get_quotas sends GET /quotas and returns the body', async () => {
    const body = {
      uid: 'w1',
      name: 'WS',
      credits_left: 65.6,
      credits_max: 100,
      credits_used: 34.4,
      plan_name: 'Trial',
      current_month_start: '2026-11-01',
      current_month_end: '2026-11-30',
    };
    const spy = mockResponse({ body });
    const result = await getQuotas.run(makeContext({ propsValue: {} }));
    expect(sentRequest({ spy })).toEqual({
      method: 'GET',
      url: `${BASE}/quotas`,
      queryParams: {},
      headers: HEADERS,
    });
    expect(result).toEqual(body);
  });
});

describe('captain-data registration', () => {
  it('registers all 13 actions plus the custom API call', () => {
    const names = Object.keys(captainData.actions()).sort();
    expect(names).toEqual(
      [
        'custom_api_call',
        'enrich_company',
        'enrich_person',
        'find_company',
        'find_company_employees',
        'find_person',
        'getJobResults',
        'get_quotas',
        'launchWorkflow',
        'list_person_certifications',
        'list_person_experiences',
        'list_person_skills',
        'search_companies',
        'search_people',
      ].sort()
    );
  });
});

describe('profile URL not found hint', () => {
  it('adds the Person UID hint when a profile URL lookup gets a 424', async () => {
    const { captainDataUtils, PROFILE_URL_NOT_FOUND_HINT } = await import(
      '../src/lib/common'
    );
    const error = captainDataUtils.toCaptainDataError({
      error: {
        response: {
          status: 424,
          body: {
            error_label: 'STATUS_404',
            message: 'This resource does not exist (404).',
          },
        },
      },
      operation: 'list person skills',
      invalidInputHint: PROFILE_URL_NOT_FOUND_HINT,
    });
    expect(error.message).toContain('use its uid as Person UID instead');
  });
});

describe('captain-data preflight fixes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function okResponse({ body }: { body: unknown }) {
    return vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValue({ status: 200, headers: {}, body });
  }

  it('accepts a numeric LinkedIn company ID and numeric person uid', async () => {
    const spy = okResponse({ body: [] });
    await findCompanyEmployees.run(
      makeContext({ propsValue: { company_id: 27193685 } })
    );
    expect(spy.mock.calls[0][0].url).toBe(
      'https://api.captaindata.com/v1/companies/27193685/employees'
    );
    expect(
      captainDataUtils.personLookupParams({
        peopleUid: 42,
        liProfileUrl: undefined,
      })
    ).toEqual({ people_uid: '42' });
    expect(captainDataUtils.requireText({ value: 7, field: 'X' })).toBe('7');
    expect(() =>
      captainDataUtils.requireText({ value: Number.NaN, field: 'X' })
    ).toThrow('X is required.');
  });

  it('trims the API key in requests', async () => {
    const spy = okResponse({ body: {} });
    await captainDataClient.request({
      apiKey: '  key-1 \n',
      path: '/quotas',
      operation: 'get quotas',
    });
    expect(spy.mock.calls[0][0].headers).toMatchObject({
      'X-API-Key': 'key-1',
    });
  });

  it('validate uses a 30 s timeout and a trimmed key', async () => {
    const spy = okResponse({ body: {} });
    await captainDataAuth.validate?.(validateParams({ apiKey: ' key-2 ' }));
    expect(spy.mock.calls[0][0].timeout).toBe(30000);
    expect(spy.mock.calls[0][0].headers).toMatchObject({
      'X-API-Key': 'key-2',
    });
  });

  it('actions use the 120 s request timeout', async () => {
    const spy = okResponse({ body: {} });
    await getQuotas.run(makeContext({ propsValue: {} }));
    expect(spy.mock.calls[0][0].timeout).toBe(120000);
  });

  it('experiences and skills have no cursor prop', () => {
    expect(Object.keys(listPersonExperiences.props)).not.toContain('cursor');
    expect(Object.keys(listPersonSkills.props)).not.toContain('cursor');
  });

  it.each([listPersonCertifications])(
    '$name sends the cursor',
    async (action) => {
      const spy = okResponse({ body: [] });
      await action.run(
        makeContext({ propsValue: { people_uid: 'u1', cursor: ' C2 ' } })
      );
      expect(spy.mock.calls[0][0].queryParams).toEqual({
        people_uid: 'u1',
        cursor: 'C2',
      });
    }
  );

  it('find_company_employees adds the company ID hint on 404 only', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      httpError({
        status: 404,
        body: { error: { code: 404, status: 'Not Found' } },
      })
    );
    await expect(
      findCompanyEmployees.run(
        makeContext({ propsValue: { company_id: 'd1c45361-uuid' } })
      )
    ).rejects.toThrow(
      'Captain Data find company employees failed (404): Not Found. Check the Company ID: use the uid from Enrich Company or Search Companies'
    );
    const error = await captainDataClient
      .request({ apiKey: API_KEY, path: '/quotas', operation: 'get quotas' })
      .catch((e: unknown) => e);
    expect(error instanceof Error ? error.message : '').not.toContain(
      'Check the Company ID'
    );
  });

  it('deprecated actions do not require a connection', () => {
    expect(launchWorkflow.requireAuth).toBe(false);
    expect(getJobResults.requireAuth).toBe(false);
  });

  it('li_company_id never uses a number format', () => {
    const actions = Object.values(captainData.actions());
    const formats = actions.flatMap(
      (action) =>
        JSON.stringify(action.outputSchema ?? {}).match(
          /"key":"li_company_id","label":"[^"]*","format"/g
        ) ?? []
    );
    expect(formats).toEqual([]);
  });
});

describe('captain-data transient STATUS_404 retry', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function transient404() {
    return httpError({
      status: 424,
      body: {
        error_label: 'STATUS_404',
        message: 'This resource does not exist (404).',
      },
    });
  }

  const URL_PROPS = { li_profile_url: 'https://www.linkedin.com/in/jane' };

  it.each([
    { action: listPersonExperiences, body: [{ title: 't' }] },
    { action: listPersonSkills, body: [{ name: 's' }] },
    { action: listPersonCertifications, body: [{ title: 'c' }] },
    { action: enrichPerson, body: { uid: 'p1' } },
  ])(
    '$action.name retries a URL lookup once and succeeds',
    async ({ action, body }) => {
      const spy = vi
        .spyOn(httpClient, 'sendRequest')
        .mockRejectedValueOnce(transient404())
        .mockResolvedValueOnce({ status: 200, headers: {}, body });
      await expect(
        action.run(makeContext({ propsValue: URL_PROPS }))
      ).resolves.toBeDefined();
      expect(spy).toHaveBeenCalledTimes(2);
    }
  );

  it('throws with the hint after two failures', async () => {
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockRejectedValue(transient404());
    await expect(
      listPersonSkills.run(makeContext({ propsValue: URL_PROPS }))
    ).rejects.toThrow('use its uid as Person UID instead');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('does not retry a people_uid lookup', async () => {
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockRejectedValue(transient404());
    await expect(
      listPersonSkills.run(makeContext({ propsValue: { people_uid: 'u1' } }))
    ).rejects.toThrow('(424)');
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not retry other errors on a URL lookup', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      httpError({
        status: 424,
        body: { error_label: 'GENERIC_ERROR', message: 'x' },
      })
    );
    await expect(
      listPersonExperiences.run(makeContext({ propsValue: URL_PROPS }))
    ).rejects.toThrow('(424)');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
