import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
    return {
        ...actual,
        httpClient: { sendRequest: vi.fn() },
    };
});

import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { checkAmlPep } from '../src/lib/actions/check-aml-pep';
import { checkFivBulk } from '../src/lib/actions/check-fiv-bulk';
import { compareCompanies } from '../src/lib/actions/compare-companies';
import { getCompany } from '../src/lib/actions/get-company';
import { getCompanyIp } from '../src/lib/actions/get-company-ip';
import { searchCompanies } from '../src/lib/actions/search-companies';
import { startAmlReport } from '../src/lib/actions/start-aml-report';

const sendRequest = httpClient.sendRequest as ReturnType<typeof vi.fn>;

const AUTH = {
    type: 'CUSTOM_AUTH',
    props: { apiKey: 'test-key-123', baseUrl: 'https://firmaradar.example' },
};

const fixture = (name: string): unknown =>
    JSON.parse(readFileSync(join(__dirname, 'fixtures', name), 'utf-8'));

const actionContext = (propsValue: Record<string, unknown>) =>
    ({
        ...createMockActionContext({ propsValue: propsValue as never }),
        auth: AUTH,
    }) as never;

const respondWith = (body: unknown, status = 200) => {
    sendRequest.mockResolvedValueOnce({ status, body, headers: {} });
};

const lastRequest = (): HttpRequest => sendRequest.mock.calls.at(-1)?.[0] as HttpRequest;

beforeEach(() => {
    sendRequest.mockReset();
});

describe('search_companies', () => {
    it('builds the canonical unified-search request and returns the body', async () => {
        const body = { items: [{ orgnr: '923609016', navn: 'Eksempel AS' }], next_cursor: null };
        respondWith(body);
        const result = await searchCompanies.run(
            actionContext({ q: 'eksempel', nace: '47.110', limit: 20 }),
        );
        const request = lastRequest();
        expect(request.url).toBe('https://firmaradar.example/api/v1/companies/search');
        expect(request.method).toBe('GET');
        expect(request.queryParams).toEqual({ q: 'eksempel', nace: '47.110', limit: '20' });
        expect(request.headers).toMatchObject({
            'X-API-Key': 'test-key-123',
            'X-FR-Client': 'activepieces',
        });
        expect(result).toEqual(body);
    });
});

describe('get_company', () => {
    it('joins the field selector into a comma-separated fields param', async () => {
        respondWith({ orgnr: '923609016' });
        await getCompany.run(actionContext({ orgnr: '923609016', fields: ['group', 'ip'] }));
        const request = lastRequest();
        expect(request.url).toBe('https://firmaradar.example/api/v1/company/923609016');
        expect(request.queryParams).toEqual({ fields: 'group,ip' });
    });

    it('omits the fields param when no sections are selected', async () => {
        respondWith({ orgnr: '923609016' });
        await getCompany.run(actionContext({ orgnr: '923609016', fields: [] }));
        expect(lastRequest().queryParams).toBeUndefined();
    });
});

describe('get_company_ip', () => {
    it('unwraps the ip_rettigheter envelope', async () => {
        const body = fixture('company-ip-response.json') as Record<string, unknown>;
        respondWith(body);
        const result = await getCompanyIp.run(actionContext({ orgnr: '923609016' }));
        expect(result).toEqual(body.ip_rettigheter);
    });
});

describe('compare_companies', () => {
    it('POSTs parsed orgnrs with optional years/metrics', async () => {
        respondWith({ orgnrs: ['923609016', '914778271'] });
        await compareCompanies.run(
            actionContext({
                orgnrs: ['923609016, 914778271'],
                years: 3,
                metrics: ['omsetning'],
            }),
        );
        const request = lastRequest();
        expect(request.method).toBe('POST');
        expect(request.url).toBe('https://firmaradar.example/api/v1/companies/compare');
        expect(request.body).toEqual({
            orgnrs: ['923609016', '914778271'],
            years: 3,
            metrics: ['omsetning'],
        });
    });
});

describe('check_fiv_bulk', () => {
    it('sends up to 50 parsed orgnrs and returns per-orgnr results', async () => {
        const body = fixture('fiv-bulk-response.json');
        respondWith(body);
        const result = await checkFivBulk.run(
            actionContext({ orgnrs: ['923609016', '999999999'], skipFreshness: true }),
        );
        const request = lastRequest();
        expect(request.url).toBe('https://firmaradar.example/api/v1/fiv/bulk');
        expect(request.body).toEqual({
            orgnrs: ['923609016', '999999999'],
            skip_freshness: true,
        });
        expect(result).toEqual(body);
    });
});

describe('check_aml_pep', () => {
    it('sends the AmlCheckRequest body plus the DPA gate headers', async () => {
        const body = fixture('aml-check-response.json');
        respondWith(body);
        const result = await checkAmlPep.run(
            actionContext({
                name: 'Ola Nordmann',
                birthYear: 1970,
                kategori: 'both',
                minMatchRatio: 0.9,
                purpose: 'kyc_onboarding',
                dpaConfirmed: true,
            }),
        );
        const request = lastRequest();
        expect(request.url).toBe('https://firmaradar.example/api/v1/aml/check');
        expect(request.method).toBe('POST');
        expect(request.headers).toMatchObject({
            'X-FR-Purpose': 'kyc_onboarding',
            'X-FR-DPA-Confirmed': 'true',
        });
        expect(request.body).toEqual({
            name: 'Ola Nordmann',
            birth_year: 1970,
            kategori: 'both',
            min_match_ratio: 0.9,
        });
        expect(result).toEqual(body);
    });

    it('refuses to call the API without the DPA confirmation', async () => {
        await expect(
            checkAmlPep.run(
                actionContext({
                    name: 'Ola Nordmann',
                    purpose: 'kyc_onboarding',
                    dpaConfirmed: false,
                }),
            ),
        ).rejects.toThrow(/DPA confirmation/);
        expect(sendRequest).not.toHaveBeenCalled();
    });
});

describe('start_aml_report', () => {
    it('adds the Idempotency-Key header when provided', async () => {
        respondWith({ rapport_id: 'abc123', status: 'pending' }, 202);
        await startAmlReport.run(
            actionContext({
                orgnr: '923609016',
                purpose: 'kyc_review',
                dpaConfirmed: true,
                idempotencyKey: 'flow-run-1',
            }),
        );
        const request = lastRequest();
        expect(request.url).toBe('https://firmaradar.example/api/v1/aml/report');
        expect(request.headers).toMatchObject({
            'X-FR-Purpose': 'kyc_review',
            'X-FR-DPA-Confirmed': 'true',
            'Idempotency-Key': 'flow-run-1',
        });
        expect(request.body).toEqual({ orgnr: '923609016', purpose: 'kyc_review' });
    });
});
