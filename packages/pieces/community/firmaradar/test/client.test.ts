import { describe, expect, it } from 'vitest';
import { HttpMethod } from '@activepieces/pieces-common';
import {
    CLIENT_MARKER,
    DEFAULT_BASE_URL,
    authProps,
    baseUrlOf,
    buildRequest,
    dpaHeaders,
    isNotFoundError,
    queryOf,
} from '../src/lib/common/client';

const FLAT_AUTH = { apiKey: 'test-key-123', baseUrl: 'https://firmaradar.example' };
const WRAPPED_AUTH = { type: 'CUSTOM_AUTH', props: FLAT_AUTH };

describe('authProps', () => {
    it('unwraps a Context-V2 wrapped connection value', () => {
        expect(authProps(WRAPPED_AUTH)).toEqual(FLAT_AUTH);
    });

    it('passes a flat props object through (validate() shape)', () => {
        expect(authProps(FLAT_AUTH)).toEqual(FLAT_AUTH);
    });
});

describe('baseUrlOf', () => {
    it('defaults to the hosted platform when unset or blank', () => {
        expect(baseUrlOf({ apiKey: 'k' })).toBe(DEFAULT_BASE_URL);
        expect(baseUrlOf({ apiKey: 'k', baseUrl: '   ' })).toBe(DEFAULT_BASE_URL);
    });

    it('strips trailing slashes', () => {
        expect(baseUrlOf({ apiKey: 'k', baseUrl: 'https://x.example//' })).toBe('https://x.example');
    });
});

describe('queryOf', () => {
    it('drops undefined, null and empty values and stringifies the rest', () => {
        expect(
            queryOf({ q: 'acme', limit: 20, cursor: undefined, kommune: null, nace: '' }),
        ).toEqual({ q: 'acme', limit: '20' });
    });
});

describe('buildRequest', () => {
    it('sets auth header, client marker and Accept on every request', () => {
        const request = buildRequest(WRAPPED_AUTH, {
            method: HttpMethod.GET,
            path: '/api/v1/companies/search',
            query: { q: 'acme', limit: 1 },
        });
        expect(request.url).toBe('https://firmaradar.example/api/v1/companies/search');
        expect(request.method).toBe(HttpMethod.GET);
        expect(request.headers).toMatchObject({
            'X-API-Key': 'test-key-123',
            'X-FR-Client': CLIENT_MARKER,
            Accept: 'application/json',
        });
        expect(request.queryParams).toEqual({ q: 'acme', limit: '1' });
        expect(request.body).toBeUndefined();
    });

    it('merges extra headers and passes bodies through', () => {
        const request = buildRequest(FLAT_AUTH, {
            method: HttpMethod.POST,
            path: '/api/v1/aml/check',
            headers: { 'X-FR-Purpose': 'kyc_onboarding' },
            body: { name: 'Ola Nordmann' },
        });
        expect(request.headers).toMatchObject({
            'X-API-Key': 'test-key-123',
            'X-FR-Purpose': 'kyc_onboarding',
        });
        expect(request.body).toEqual({ name: 'Ola Nordmann' });
        expect(request.queryParams).toBeUndefined();
    });

    it('omits queryParams entirely when all values are empty', () => {
        const request = buildRequest(FLAT_AUTH, {
            method: HttpMethod.GET,
            path: '/api/v1/company/923609016',
            query: { fields: undefined },
        });
        expect(request.queryParams).toBeUndefined();
    });
});

describe('dpaHeaders', () => {
    it('produces the DPA gate headers when confirmed', () => {
        expect(dpaHeaders('kyc_review', true)).toEqual({
            'X-FR-Purpose': 'kyc_review',
            'X-FR-DPA-Confirmed': 'true',
        });
    });

    it('fails fast with an actionable message when not confirmed', () => {
        expect(() => dpaHeaders('kyc_onboarding', false)).toThrow(/DPA confirmation/);
    });
});

describe('isNotFoundError', () => {
    it('detects HTTP 404 error shapes and nothing else', () => {
        expect(isNotFoundError({ response: { status: 404 } })).toBe(true);
        expect(isNotFoundError({ response: { status: 500 } })).toBe(false);
        expect(isNotFoundError(new Error('boom'))).toBe(false);
        expect(isNotFoundError(undefined)).toBe(false);
    });
});
