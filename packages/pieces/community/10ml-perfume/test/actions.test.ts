/// <reference types="vitest/globals" />
import { createMockActionContext } from '@activepieces/pieces-framework';
import * as pieces from '@activepieces/pieces-common';
import { HttpError } from '@activepieces/pieces-common';
import spec from './spec-routes.json';
import fixtures from './fixtures.json';
import { tenMlPerfume } from '../src';
import { searchPerfumes } from '../src/lib/actions/search-perfumes';
import { getPerfume } from '../src/lib/actions/get-perfume';
import { findSimilarPerfumes } from '../src/lib/actions/find-similar-perfumes';
import { findPerfumeAlternatives } from '../src/lib/actions/find-perfume-alternatives';
import { explainNote } from '../src/lib/actions/explain-note';
import { getHouse } from '../src/lib/actions/get-house';
import { listHouses } from '../src/lib/actions/list-houses';
import { searchGuides } from '../src/lib/actions/search-guides';

type Sent = { method: string; url: string; queryParams: Record<string, string> };
const sent: Sent[] = [];
let reply: { status: number; body: unknown } = { status: 200, body: {} };

beforeEach(() => {
	sent.length = 0;
	reply = { status: 200, body: {} };
	vi.spyOn(pieces.httpClient, 'sendRequest').mockImplementation(async (request) => {
		sent.push({ method: String(request.method), url: request.url, queryParams: request.queryParams ?? {} });
		if (reply.status >= 400) throw new HttpError(undefined, { status: reply.status, responseBody: reply.body });
		return { status: reply.status, headers: {}, body: reply.body } as never;
	});
});
afterEach(() => vi.restoreAllMocks());

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const call = (action: { run: (ctx: any) => Promise<unknown> }, propsValue: Record<string, unknown>) =>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	action.run(createMockActionContext({ propsValue: propsValue as any }));

type Param = { in: string; required: boolean; type?: string; enum?: string[]; minimum?: number; maximum?: number };
const routes = spec.routes as Record<string, { params: Record<string, Param> }>;

/** Match the request against the OpenAPI routes: method, path, and every query value against its parameter. */
function checkAgainstSpec(request: Sent): string {
	expect(request.url.startsWith(`${spec.server}`)).toBe(true);
	const path = request.url.slice(spec.server.length);
	const key = Object.keys(routes).find((k) => {
		const template = k.slice(k.indexOf(' ') + 1);
		return new RegExp(`^${template.replace(/\{[^}]+\}/g, '[^/]+')}$`).test(path);
	});
	expect(key, `no spec route for ${request.method} ${path}`).toBeDefined();
	expect(key!.startsWith(request.method)).toBe(true);
	const { params } = routes[key!];
	for (const [name, value] of Object.entries(request.queryParams)) {
		const param = params[name];
		expect(param, `${name} is not a query parameter of ${key}`).toBeDefined();
		expect(param.in).toBe('query');
		if (param.enum) expect(param.enum, `${name}=${value}`).toContain(value);
		if (param.type === 'integer') {
			const n = Number(value);
			expect(Number.isInteger(n)).toBe(true);
			if (param.minimum !== undefined) expect(n).toBeGreaterThanOrEqual(param.minimum);
			if (param.maximum !== undefined) expect(n).toBeLessThanOrEqual(param.maximum);
		}
		if (param.type === 'boolean') expect(['true', 'false']).toContain(value);
	}
	for (const [name, param] of Object.entries(params)) {
		if (param.required && param.in === 'path') continue;
		if (param.required) expect(request.queryParams[name], `${name} is required`).toBeDefined();
	}
	return key!;
}

const FULL: Array<[string, { run: never; props: Record<string, unknown> }, Record<string, unknown>, string]> = [
	['search_perfumes', searchPerfumes as never, {
		query: 'smoky vanilla', house: 'Tom Ford', notesInclude: ['oud', 'rose'], notesExclude: ['vanilla'],
		accords: ['woody'], family: 'Amber floral', gender: 'women', season: 'winter', occasion: 'date night',
		style: 'smoky', iconicOnly: true, limit: 20, cursor: 'bzE', detailed: true, locale: 'de',
	}, 'GET /api/v1/perfumes'],
	['get_perfume', getPerfume as never, { perfume: 'Baccarat Rouge 540', house: 'Maison Francis Kurkdjian', detailed: true, locale: 'fr' }, 'GET /api/v1/perfumes/{id}'],
	['find_similar_perfumes', findSimilarPerfumes as never, {
		perfume: 'Dior Sauvage', house: 'Dior', notes: ['saffron'], accords: ['amber'], steer: 'longer_lasting',
		gender: 'men', otherHousesOnly: true, limit: 15, cursor: 'bzE', detailed: true, locale: 'es',
	}, 'GET /api/v1/similar'],
	['find_perfume_alternatives', findPerfumeAlternatives as never, {
		perfume: 'Creed Aventus', house: 'Creed', closeness: 'very close', limit: 10, cursor: 'bzE', locale: 'it',
	}, 'GET /api/v1/alternatives'],
	['explain_note', explainNote as never, { note: 'tonka bean', detailed: true, locale: 'pl' }, 'GET /api/v1/notes/{id}'],
	['get_house', getHouse as never, { house: 'Tom Ford', detailed: true, locale: 'nl' }, 'GET /api/v1/houses/{id}'],
	['list_houses', listHouses as never, { type: 'niche', country: 'France', name: 'dior', limit: 50, cursor: 'bzE', locale: 'pt' }, 'GET /api/v1/houses'],
	['search_guides', searchGuides as never, { query: 'oud', type: 'how-to', limit: 20, cursor: 'bzE', locale: 'ro' }, 'GET /api/v1/guides'],
];

describe('piece definition', () => {
	test('has no auth, eight actions plus the custom API call, and the 10ML metadata', () => {
		expect(tenMlPerfume.auth).toBeUndefined();
		expect(Object.keys(tenMlPerfume.actions()).sort()).toEqual([
			'custom_api_call', 'explain_note', 'find_perfume_alternatives', 'find_similar_perfumes', 'get_house',
			'get_perfume', 'list_houses', 'search_guides', 'search_perfumes',
		]);
		expect(tenMlPerfume.displayName).toBe('10ML Perfume Finder');
		expect(tenMlPerfume.authors).toEqual(['10ml-com']);
		// npm build: logo on 10ml.com; community-PR variant (scripts/fork.sh pr): logo on Activepieces' CDN.
		expect(tenMlPerfume.logoUrl).toMatch(/^https:\/\/(10ml\.com\/|cdn\.activepieces\.com\/pieces\/10ml-perfume\.png$)/);
	});

	test.each(FULL)('%s carries audience, aiMetadata and classification', (_name, action) => {
		const a = action as unknown as { audience: string; aiMetadata: { description: string; idempotent: boolean }; classification: string };
		expect(a.audience).toBe('both');
		expect(a.aiMetadata.idempotent).toBe(true);
		expect(a.aiMetadata.description.length).toBeGreaterThan(40);
		expect(['READ', 'SEARCH']).toContain(a.classification);
	});
});

describe('request mapping against the OpenAPI spec', () => {
	test.each(FULL)('%s sends only spec parameters with valid values', async (_name, action, props, route) => {
		await call(action as never, props);
		expect(sent).toHaveLength(1);
		expect(checkAgainstSpec(sent[0])).toBe(route);
	});

	test('every static dropdown option is accepted by the spec enum', async () => {
		const queryName: Record<string, string> = {
			gender: 'gender', season: 'season', occasion: 'occasion', style: 'style', steer: 'steer',
			closeness: 'closeness', type: 'type', locale: 'locale',
		};
		let checked = 0;
		for (const [name, action, props] of FULL) {
			const defs = (action as unknown as { props: Record<string, { type: string; options?: { options: { value: string }[] } }> }).props;
			for (const [prop, def] of Object.entries(defs)) {
				if (def.type !== 'STATIC_DROPDOWN' || !queryName[prop]) continue;
				for (const option of def.options!.options) {
					sent.length = 0;
					await call(action as never, { ...props, [prop]: option.value });
					checkAgainstSpec(sent[0]);
					expect(sent[0].queryParams[queryName[prop]], `${name}.${prop}`).toBe(option.value);
					checked++;
				}
			}
		}
		expect(checked).toBeGreaterThan(60);
	});

	test('every query parameter in the spec is reachable from some action', async () => {
		const reached = new Map<string, Set<string>>();
		for (const [, action, props, route] of FULL) {
			sent.length = 0;
			await call(action as never, props);
			const set = reached.get(route) ?? new Set<string>();
			Object.keys(sent[0].queryParams).forEach((k) => set.add(k));
			reached.set(route, set);
		}
		for (const [key, { params }] of Object.entries(routes)) {
			const route = key.replace('GET ', 'GET ');
			for (const [name, p] of Object.entries(params)) {
				if (p.in === 'query') expect(reached.get(route)?.has(name), `${route} ${name}`).toBe(true);
			}
		}
	});

	test('lists become comma lists, empty values are dropped, the name is URL-encoded', async () => {
		await call(searchPerfumes as never, { query: '', notesInclude: [' oud ', 'rose', ''], notesExclude: [], limit: 8, detailed: false });
		expect(sent[0].queryParams).toEqual({ notes_include: 'oud,rose', limit: '8', format: 'concise' });
		sent.length = 0;
		await call(getPerfume as never, { perfume: ' Dior / Sauvage ' });
		expect(sent[0].url).toBe('https://mcp.10ml.com/api/v1/perfumes/Dior%20%2F%20Sauvage');
	});

	test('Find Similar refuses an empty request before calling the API', async () => {
		await expect(call(findSimilarPerfumes as never, { perfume: ' ', notes: [], accords: [] })).rejects.toThrow(/perfume, or at least one note/);
		expect(sent).toHaveLength(0);
	});
});

describe('output shape', () => {
	const flat = (row: unknown) => {
		for (const value of Object.values(row as Record<string, unknown>)) {
			expect(value === null || ['string', 'number', 'boolean'].includes(typeof value)).toBe(true);
		}
	};

	test('search returns flat records with identical keys', async () => {
		reply.body = fixtures.search_detailed;
		const rows = (await call(searchPerfumes as never, { detailed: true })) as Record<string, unknown>[];
		expect(rows).toHaveLength(2);
		rows.forEach(flat);
		expect(Object.keys(rows[0])).toEqual(Object.keys(rows[1]));
		expect(rows[0]).toMatchObject({
			id: 'tom-ford-private-blend-oud-wood-edp', name: 'Oud Wood', house: 'Tom Ford', year: 2007,
			accords: 'oud, woody, spicy, amber, vanilla', top_notes: 'rosewood, cardamom, sichuan pepper', longevity: 4,
		});
		expect(rows[0]['url']).toMatch(/^https:\/\/10ml\.com\/search/);
	});

	test('raw response returns the API body untouched', async () => {
		reply.body = fixtures.search_detailed;
		expect(await call(searchPerfumes as never, { raw: true })).toBe(fixtures.search_detailed);
	});

	test('get perfume is one flat object; an unknown name comes back with found false and suggestions', async () => {
		reply.body = fixtures.get_perfume;
		const row = (await call(getPerfume as never, { perfume: 'Baccarat Rouge 540' })) as Record<string, unknown>;
		flat(row);
		expect(row).toMatchObject({ found: true, exact_match: true, name: 'Baccarat Rouge 540', house_country: 'France' });
		expect(String(row['similar_perfumes'])).toContain('Club de Nuit Untold (Armaf)');

		reply = { status: 404, body: fixtures.get_perfume_missing };
		const missing = (await call(getPerfume as never, { perfume: 'Baccarat Rouge 54' })) as Record<string, unknown>;
		flat(missing);
		expect(Object.keys(missing)).toEqual(Object.keys(row));
		expect(missing).toMatchObject({ found: false, name: null });
		expect(String(missing['suggestions'])).toContain('Baccarat Rouge 540 (Maison Francis Kurkdjian)');
	});

	test('similar, alternatives, houses and guides return arrays of flat rows', async () => {
		reply.body = fixtures.similar;
		const similar = (await call(findSimilarPerfumes as never, { perfume: 'Baccarat Rouge 540' })) as Record<string, unknown>[];
		similar.forEach(flat);
		expect(similar[0]).toMatchObject({ closeness: 'very close', shared_notes: expect.stringContaining('saffron') });

		reply.body = fixtures.alternatives;
		const alts = (await call(findPerfumeAlternatives as never, { perfume: 'Baccarat Rouge 540' })) as Record<string, unknown>[];
		alts.forEach(flat);
		expect(alts[0]).toMatchObject({ original: expect.stringContaining('Baccarat Rouge 540'), closeness: expect.any(String), why: expect.any(String) });

		reply.body = fixtures.houses;
		const houses = (await call(listHouses as never, { type: 'niche' })) as Record<string, unknown>[];
		houses.forEach(flat);
		expect(houses[0]).toMatchObject({ id: 'xerjoff', country: 'Italy', type: 'niche' });

		reply.body = fixtures.guides;
		const guides = (await call(searchGuides as never, { query: 'oud' })) as Record<string, unknown>[];
		guides.forEach(flat);
		expect(guides[0]['url']).toMatch(/^https:\/\/10ml\.com\/guides\//);
	});

	test('note and house lookups flatten, and an unknown note is not an error', async () => {
		reply.body = fixtures.note;
		const note = (await call(explainNote as never, { note: 'oud' })) as Record<string, unknown>;
		flat(note);
		expect(note).toMatchObject({ found: true, name: 'oud', family: 'woody' });
		expect(String(note['also_called'])).toContain('agarwood');

		reply = { status: 404, body: fixtures.note_missing };
		const missing = (await call(explainNote as never, { note: 'zzzqq' })) as Record<string, unknown>;
		expect(missing).toMatchObject({ found: false, name: null });
		expect(String(missing['message'])).toContain('is not a note');

		reply = { status: 200, body: fixtures.house };
		const house = (await call(getHouse as never, { house: 'tom-ford' })) as Record<string, unknown>;
		flat(house);
		expect(house).toMatchObject({ found: true, name: 'Tom Ford', country: 'United States', perfumes_in_index: 49 });
	});
});

describe('errors', () => {
	test('a 400 fails the step with the API message', async () => {
		reply = { status: 400, body: { error: { code: 'invalid_request', message: 'limit: Too big: expected number to be <=20' } } };
		await expect(call(searchPerfumes as never, { limit: 99 })).rejects.toThrow('limit: Too big: expected number to be <=20');
	});

	test('a 500 without a body still gives a readable message', async () => {
		reply = { status: 503, body: 'upstream' };
		await expect(call(listHouses as never, {})).rejects.toThrow('10ML Perfume Finder answered HTTP 503');
	});
});
