/// <reference types="vitest/globals" />
// Live calls against https://mcp.10ml.com (no key). Run with: LIVE=1 bun run test  (skipped otherwise).
import { createMockActionContext } from '@activepieces/pieces-framework';
import { searchPerfumes } from '../src/lib/actions/search-perfumes';
import { getPerfume } from '../src/lib/actions/get-perfume';
import { findSimilarPerfumes } from '../src/lib/actions/find-similar-perfumes';
import { findPerfumeAlternatives } from '../src/lib/actions/find-perfume-alternatives';
import { explainNote } from '../src/lib/actions/explain-note';
import { getHouse } from '../src/lib/actions/get-house';
import { listHouses } from '../src/lib/actions/list-houses';
import { searchGuides } from '../src/lib/actions/search-guides';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const call = async (action: { run: (ctx: any) => Promise<unknown> }, propsValue: Record<string, unknown>) =>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	action.run(createMockActionContext({ propsValue: propsValue as any })) as Promise<any>;

describe.skipIf(!process.env['LIVE'])('live API', () => {
	test('search_perfumes', async () => {
		const rows = await call(searchPerfumes as never, { query: 'oud', limit: 3, detailed: true });
		expect(rows.length).toBeGreaterThan(0);
		expect(rows[0].name).toBeTruthy();
		expect(rows[0].top_notes ?? rows[0].heart_notes).toBeTruthy();
	});

	test('get_perfume', async () => {
		const row = await call(getPerfume as never, { perfume: 'Baccarat Rouge 540' });
		expect(row).toMatchObject({ found: true, name: 'Baccarat Rouge 540', house: 'Maison Francis Kurkdjian' });
		const missing = await call(getPerfume as never, { perfume: 'zzz not a perfume 123' });
		expect(missing.found).toBe(false);
	});

	test('find_similar_perfumes', async () => {
		const rows = await call(findSimilarPerfumes as never, { perfume: 'Dior Sauvage', limit: 3 });
		expect(rows.length).toBeGreaterThan(0);
		expect(rows[0].closeness).toBeTruthy();
		const byNotes = await call(findSimilarPerfumes as never, { notes: ['oud', 'rose'], limit: 2 });
		expect(byNotes.length).toBeGreaterThan(0);
	});

	test('find_perfume_alternatives', async () => {
		const rows = await call(findPerfumeAlternatives as never, { perfume: 'Baccarat Rouge 540', limit: 3 });
		expect(rows.length).toBeGreaterThan(0);
		expect(rows[0].why).toBeTruthy();
	});

	test('explain_note', async () => {
		const row = await call(explainNote as never, { note: 'oud' });
		expect(row).toMatchObject({ found: true, name: 'oud' });
		expect(row.smells_like).toBeTruthy();
	});

	test('get_house', async () => {
		const row = await call(getHouse as never, { house: 'Tom Ford' });
		expect(row).toMatchObject({ found: true, name: 'Tom Ford' });
	});

	test('list_houses', async () => {
		const rows = await call(listHouses as never, { type: 'niche', limit: 3 });
		expect(rows).toHaveLength(3);
		expect(rows[0].type).toBe('niche');
	});

	test('search_guides', async () => {
		const rows = await call(searchGuides as never, { query: 'oud', limit: 3, locale: 'de' });
		expect(rows.length).toBeGreaterThan(0);
		expect(rows[0].url).toMatch(/^https:\/\/10ml\.com\//);
	});

	test('pagination: the raw response carries next_cursor and the cursor reads page two', async () => {
		const page1 = await call(searchPerfumes as never, { query: 'oud', limit: 2, raw: true });
		expect(page1.next_cursor).toBeTruthy();
		const page2 = await call(searchPerfumes as never, { query: 'oud', limit: 2, cursor: page1.next_cursor });
		expect(page2[0].id).not.toBe(page1.results[0].id);
	});

	test('the spec snapshot in test/spec-routes.json matches the live spec', async () => {
		const live = await (await fetch('https://mcp.10ml.com/openapi.json')).json();
		const snap = (await import('./spec-routes.json')).default as { routes: Record<string, { params: Record<string, unknown> }> };
		for (const [path, item] of Object.entries(live.paths as Record<string, Record<string, { parameters?: { name: string }[] }>>)) {
			for (const [method, op] of Object.entries(item)) {
				const names = (op.parameters ?? []).map((p) => p.name).sort();
				expect(Object.keys(snap.routes[`${method.toUpperCase()} ${path}`].params).sort()).toEqual(names);
			}
		}
	});
});
