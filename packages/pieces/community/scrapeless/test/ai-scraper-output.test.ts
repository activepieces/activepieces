import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppConnectionType, createMockActionContext } from '@activepieces/pieces-framework';
import { aiScraperAction } from '../src/lib/actions/ai-scraper';

const fetchMock = vi.fn<typeof fetch>();
const native = { result_text: 'An answer.', citations: [{ title: 'Source', url: 'https://example.com', nested: { rank: 1 } }], products: [{ price: 5 }] };

async function run({ format, operation = 'get_task_result' }: { format?: string; operation?: string }) {
  const result = await aiScraperAction.run({
    ...createMockActionContext<typeof aiScraperAction.props>({ propsValue: {
      operation, wait_settings: undefined, output_format: format, website: { engine: 'chatgpt' },
      parameters: { task_id: 'output-task', prompt: 'Test', country: 'US' },
    } }),
    auth: { type: AppConnectionType.SECRET_TEXT, secret_text: 'output-test-key' },
  });
  if (!isRecord(result)) throw new Error('Expected a result object.');
  return result;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('AI Scraper output formats', () => {
  it.each([undefined, 'table'])('returns only primitive values with lossless JSON text for format %s', async (format) => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ task_id: 'output-task', status: 'success', task_result: native })));
    const result = await run({ format });
    expect(Object.keys(result)).toHaveLength(21);
    expect(Object.values(result).every(value => value === null || ['string', 'number', 'boolean'].includes(typeof value))).toBe(true);
    expect(result).toMatchObject({ task_id: 'output-task', completed: true, has_answer: true, result_text: 'An answer.' });
    expect(JSON.parse(String(result.task_result))).toEqual(native);
    expect(JSON.parse(String(result.citations))).toEqual(native.citations);
    expect(result.links).toBe('[]');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('preserves the original objects and arrays in explicit raw mode', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ task_id: 'output-task', status: 'success', task_result: native })));
    const result = await run({ format: 'raw' });
    expect(result.task_result).toEqual(native);
    expect(result.citations).toEqual(native.citations);
    expect(result.links).toEqual([]);
  });

  it('keeps creation mapping and pending values stable in table mode', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ task_id: 'output-task' }), { status: 201 }));
    const result = await run({ operation: 'create_task' });
    expect(result).toMatchObject({ task_id: 'output-task', status: 'pending', completed: false, task_result: null, result_text: null, citations: '[]' });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ actor: 'scraper.chatgpt', input: { prompt: 'Test', country: 'US', web_search: true, shopping: false } });
  });

  it('rejects an unsupported output format before creating a paid task', async () => {
    await expect(run({ format: 'unknown', operation: 'create_task' })).rejects.toThrow('Select Table-Friendly Fields');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
