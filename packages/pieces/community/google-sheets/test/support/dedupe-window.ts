import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework';
import { records } from './engine-context';

export function dedupeWindow({ windowMs }: { windowMs: number }) {
	const seen = new Map<string, number>();
	const clock = { now: 0 };
	return {
		advance: ({ ms }: { ms: number }) => {
			clock.now += ms;
		},
		filter: ({ output }: { output: unknown }): Record<string, unknown>[] =>
			records({ value: output }).filter((item) => {
				const key = item[DEDUPE_KEY_PROPERTY];
				if (typeof key !== 'string') return true;
				const expiresAt = seen.get(key);
				if (expiresAt !== undefined && expiresAt > clock.now) return false;
				seen.set(key, clock.now + windowMs);
				return true;
			}),
	};
}
