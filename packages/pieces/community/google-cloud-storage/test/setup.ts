import { beforeEach, vi } from 'vitest';

const blockNetwork = vi.fn(async (input: unknown): Promise<Response> => {
  throw new Error(`Unexpected network call in tests: ${String(input)}`);
});

beforeEach(() => {
  vi.stubGlobal('fetch', blockNetwork);
});
