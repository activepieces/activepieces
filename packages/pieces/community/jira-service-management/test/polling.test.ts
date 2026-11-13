import { describe, expect, it } from 'vitest';
import { newRequestPolling } from '../src/lib/common/polling';

const MINUTE = 60_000;
const T0 = Date.parse('2026-11-13T18:00:00.000+0000');

function issue({ id, created }: { id: string; created: string }) {
	return { id, key: `SD-${id}`, fields: { created } };
}

describe('newRequestPolling.selectFresh', () => {
	it('keeps only issues created after the window start that were not emitted before', () => {
		const state = { windowStart: T0, seen: { '2': T0 + 1000 } };
		const issues = [
			issue({ id: '1', created: '2026-11-13T17:59:59.000+0000' }),
			issue({ id: '2', created: '2026-11-13T18:00:01.000+0000' }),
			issue({ id: '3', created: '2026-11-13T18:00:01.000+0000' }),
		];
		expect(newRequestPolling.selectFresh({ issues, state }).map((item) => item.id)).toEqual(['3']);
	});

	it('emits two requests created in the same second across two polls', () => {
		const first = issue({ id: '10', created: '2026-11-13T18:00:06.000+0000' });
		const second = issue({ id: '11', created: '2026-11-13T18:00:06.000+0000' });
		const start = { windowStart: T0, seen: {} };
		const freshOne = newRequestPolling.selectFresh({ issues: [first], state: start });
		const afterOne = newRequestPolling.advance({ state: start, issues: [first], fresh: freshOne, truncated: false, now: T0 + 10_000 });
		const freshTwo = newRequestPolling.selectFresh({ issues: [first, second], state: afterOne });
		expect(freshOne.map((item) => item.id)).toEqual(['10']);
		expect(freshTwo.map((item) => item.id)).toEqual(['11']);
	});

	it('ignores issues without a readable created date', () => {
		const state = { windowStart: T0, seen: {} };
		expect(newRequestPolling.selectFresh({ issues: [{ id: '1', key: 'SD-1', fields: {} }], state })).toEqual([]);
	});
});

describe('newRequestPolling.advance', () => {
	it('keeps the window start until the lookback passes it, then slides and forgets old ids', () => {
		const fresh = [issue({ id: '1', created: '2026-11-13T18:01:00.000+0000' })];
		const early = newRequestPolling.advance({ state: { windowStart: T0, seen: {} }, issues: fresh, fresh, truncated: false, now: T0 + 5 * MINUTE });
		expect(early).toEqual({ windowStart: T0, seen: { '1': T0 + MINUTE } });
		const later = newRequestPolling.advance({ state: early, issues: [], fresh: [], truncated: false, now: T0 + 30 * MINUTE });
		expect(later).toEqual({ windowStart: T0 + 15 * MINUTE, seen: {} });
	});

	it('moves the window to just before the newest fetched issue when the page was truncated', () => {
		const issues = [
			issue({ id: '1', created: '2026-11-13T18:01:00.000+0000' }),
			issue({ id: '2', created: '2026-11-13T18:02:00.000+0000' }),
		];
		const next = newRequestPolling.advance({ state: { windowStart: T0, seen: {} }, issues, fresh: issues, truncated: true, now: T0 + 60 * MINUTE });
		expect(next.windowStart).toBe(T0 + 2 * MINUTE - 1);
		expect(next.seen).toEqual({ '2': T0 + 2 * MINUTE });
	});
});

describe('newRequestPolling.relativeJqlDate', () => {
	it('rounds up to whole minutes plus one so no request is missed', () => {
		expect(newRequestPolling.relativeJqlDate({ sinceEpochMs: T0, now: T0 + 90_000 })).toBe('"-3m"');
		expect(newRequestPolling.relativeJqlDate({ sinceEpochMs: T0, now: T0 })).toBe('"-1m"');
	});
});
