import { afterEach, describe, expect, test, vi } from 'vitest';
import { findCompanyAction } from '../src/lib/actions/find-company';
import { findOrCreateCompanyAction } from '../src/lib/actions/find-or-create-company';
import { getCompanyAction } from '../src/lib/actions/get-company';
import { runAction, stubIntercom } from './helpers';

const COMPANY = { type: 'company', id: '6a1', company_id: 'acme-001', name: 'Acme' };
const NOT_FOUND = { status: 404, body: { type: 'error.list', errors: [{ code: 'company_not_found', message: 'Company Not Found' }] } };

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

describe('Find Company (P1-2)', () => {
	test('404 company_not_found returns found=false instead of failing', async () => {
		stubIntercom([{ method: 'GET', path: '/companies', reply: NOT_FOUND }]);
		const output = await runAction({ action: findCompanyAction, props: { searchField: 'name', searchValue: 'does-not-exist' } });
		expect(output).toEqual({ found: false, company: {}, user: {} });
	});

	test('a match is returned under company and the legacy user key', async () => {
		const seen = stubIntercom([{ method: 'GET', path: '/companies', reply: { body: { type: 'list', data: [COMPANY], total_count: 1 } } }]);
		const output = await runAction({ action: findCompanyAction, props: { searchField: 'company_id', searchValue: 'acme-001' } });
		expect(output).toEqual({ found: true, company: COMPANY, user: COMPANY });
		expect(seen[0].query).toEqual({ company_id: 'acme-001', per_page: '1' });
	});

	test('a single company object response is accepted too', async () => {
		stubIntercom([{ method: 'GET', path: '/companies', reply: { body: COMPANY } }]);
		const output = await runAction({ action: findCompanyAction, props: { searchField: 'company_id', searchValue: 'acme-001' } });
		expect(output).toEqual({ found: true, company: COMPANY, user: COMPANY });
	});

	test('other errors still fail the step', async () => {
		stubIntercom([{ method: 'GET', path: '/companies', reply: { status: 401, body: { errors: [{ code: 'unauthorized', message: 'Access Token Invalid' }] } } }]);
		await expect(runAction({ action: findCompanyAction, props: { searchField: 'name', searchValue: 'x' } })).rejects.toThrow('(401)');
	});
});

describe('Find or Create Company (P1-2)', () => {
	test('creates the company when the lookup 404s', async () => {
		const seen = stubIntercom([
			{ method: 'GET', path: '/companies', reply: NOT_FOUND },
			{ method: 'POST', path: '/companies', reply: { body: COMPANY } },
		]);
		const output = await runAction({
			action: findOrCreateCompanyAction,
			props: { companyId: 'acme-001', name: 'Acme', size: 10 },
		});
		expect(output).toEqual({ created: true, company: COMPANY });
		expect(seen.find((r) => r.method === 'POST')?.body).toEqual({ company_id: 'acme-001', name: 'Acme', size: 10 });
	});

	test('returns the existing company without creating', async () => {
		const seen = stubIntercom([{ method: 'GET', path: '/companies', reply: { body: { type: 'list', data: [COMPANY] } } }]);
		const output = await runAction({ action: findOrCreateCompanyAction, props: { name: 'Acme' } });
		expect(output).toEqual({ created: false, company: COMPANY });
		expect(seen.every((r) => r.method === 'GET')).toBe(true);
		expect(seen[0].query['name']).toBe('Acme');
	});
});

describe('Get Company', () => {
	test('by your Company ID fails clearly when none matches', async () => {
		stubIntercom([{ method: 'GET', path: '/companies', reply: NOT_FOUND }]);
		await expect(runAction({ action: getCompanyAction, props: { lookupBy: 'company_id', value: 'nope' } })).rejects.toThrow(
			'No Intercom company has the Company ID nope.',
		);
	});

	test('by Intercom ID calls GET /companies/{id}', async () => {
		const seen = stubIntercom([{ method: 'GET', path: '/companies/6a1', reply: { body: COMPANY } }]);
		expect(await runAction({ action: getCompanyAction, props: { lookupBy: 'id', value: '6a1' } })).toEqual(COMPANY);
		expect(seen).toHaveLength(1);
	});
});
