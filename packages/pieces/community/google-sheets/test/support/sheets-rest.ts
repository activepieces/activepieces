import { vi } from 'vitest';
import { fakeGoogle, FakeTab } from './fake-google';

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets/';

export function installFakeSheetsRest(): void {
	vi.stubGlobal('fetch', async (input: string | URL) => {
		const url = new URL(String(input));
		if (!url.href.startsWith(BASE)) throw new Error(`unexpected request ${url.href}`);
		const path = url.pathname.split('/');
		const valuesAt = path.indexOf('values');
		if (valuesAt === -1) {
			return json({ body: { sheets: fakeGoogle.tabs.map((tab) => ({ properties: { title: tab.title, sheetId: tab.sheetId } })) } });
		}
		const range = decodeURIComponent(path.slice(valuesAt + 1).join('/'));
		return json({ body: valuesFor({ range }) });
	});
}

function json({ body }: { body: unknown }): Response {
	return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
}

function valuesFor({ range }: { range: string }): { range: string; values?: string[][] } {
	const match = /^(?:'((?:[^']|'')*)'|([^!']+))(?:!([A-Z]*)(\d+)?(?::([A-Z]*)(\d+)?)?)?$/.exec(range);
	if (!match) throw new Error(`Unable to parse range: ${range}`);
	const title = match[1] !== undefined ? match[1].replace(/''/g, "'") : match[2];
	const tab: FakeTab | undefined = fakeGoogle.tabs.find((candidate) => candidate.title === title);
	if (!tab) throw new Error(`Unable to parse range: ${range}`);
	const from = match[4] ? Number(match[4]) : 1;
	const to = match[6] ? Number(match[6]) : tab.rows.length;
	const rows = tab.rows.slice(from - 1, to).map((row) => {
		const values = row.map((cell) => String(cell.value));
		while (values.length > 0 && values[values.length - 1] === '') values.pop();
		return values;
	});
	while (rows.length > 0 && rows[rows.length - 1].length === 0) rows.pop();
	return rows.length === 0 ? { range } : { range, values: rows };
}
