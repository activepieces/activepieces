import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppConnectionType, createMockActionContext } from '@activepieces/pieces-framework';
import { aiScraperAction } from '../src/lib/actions/ai-scraper';
import { aiScraperProps } from '../src/lib/common/ai-scraper-props';

const fetchMock = vi.fn<typeof fetch>();
const auth: { type: AppConnectionType.SECRET_TEXT; secret_text: string } = {
  type: AppConnectionType.SECRET_TEXT,
  secret_text: 'unified-test-key',
};

async function run({ operation, website, parameters }: {
  operation: string;
  website?: Record<string, unknown>;
  parameters: Record<string, unknown>;
}) {
  return aiScraperAction.run({
    ...createMockActionContext<typeof aiScraperAction.props>({
      propsValue: { operation, wait_settings: undefined, output_format: 'raw', website, parameters },
    }),
    auth,
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Unified operation boundary', () => {
  it('queries once without a website and ignores stale creation fields', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ task_id: 'existing-task', status: 'running' })));
    const result = await run({
      operation: 'get_task_result',
      parameters: { task_id: 'existing-task', prompt: null, country: 'INVALID', shopping: 'true', mode: 'unknown' },
    });
    expect(result).toMatchObject({ task_id: 'existing-task', completed: false });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.scrapeless.com/api/v2/scraper/result/existing-task');
    expect(fetchMock.mock.calls[0][1]?.method).toBe('GET');
  });

  it('does not leak stale shopping, mode, location, or task IDs when switching to Alexa', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ task_id: 'created-task' }), { status: 201 }));
    await run({
      operation: 'create_task', website: { engine: 'alexa' },
      parameters: { prompt: 'Explain APIs.', shopping: true, web_search: false, mode: 'reasoning', location: 'New York', uule: 'encoded', should_fetch_share_link: true, task_id: '../old-task' },
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({ actor: 'scraper.alexa', input: { prompt: 'Explain APIs.', country: 'US' } });
  });

  it.each([
    { operation: 'unknown', website: { engine: 'chatgpt' }, parameters: { prompt: 'Test' } },
    { operation: 'create_task', parameters: { prompt: 'Test' } },
    { operation: 'create_task', website: { engine: 'not-supported' }, parameters: { prompt: 'Test' } },
    { operation: 'create_task', website: { engine: 'chatgpt' }, parameters: { prompt: 17 } },
    { operation: 'create_task', website: { engine: 'chatgpt' }, parameters: { prompt: 'Test', shopping: 'false' } },
    { operation: 'create_task', website: { engine: 'copilot' }, parameters: { prompt: 'Test', mode: 3 } },
    { operation: 'create_task', website: { engine: 'copilot' }, parameters: { prompt: 'Test', mode: 'invalid' } },
    { operation: 'create_task', website: { engine: 'aimode' }, parameters: { prompt: 'Test', location: 'NY', uule: 'encoded' } },
    { operation: 'get_task_result', parameters: { task_id: 123 } },
    { operation: 'get_task_result', parameters: { task_id: '../unsafe' } },
  ])('rejects invalid active inputs before any HTTP request: %#', async (input) => {
    await expect(run(input)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('Unified dynamic form contract', () => {
  it('registers the callbacks and refreshes parameters when operation or website changes', () => {
    expect(aiScraperAction.props.website.props).toBe(aiScraperProps.websiteProperties);
    expect(aiScraperAction.props.parameters.props).toBe(aiScraperProps.requestProperties);
    expect(aiScraperAction.props.website.refreshers).toEqual(['operation']);
    expect(aiScraperAction.props.parameters.refreshers).toEqual(['operation', 'website']);
  });

  it('offers exactly eight websites for creation', async () => {
    const props = await aiScraperProps.websiteProperties({ operation: 'create_task' });
    expect(props).toMatchObject({ engine: { required: true, defaultValue: 'chatgpt', options: { options: [
      { value: 'chatgpt' }, { value: 'perplexity' }, { value: 'copilot' }, { value: 'gemini' },
      { value: 'aimode' }, { value: 'overview' }, { value: 'grok' }, { value: 'alexa' },
    ] } } });
    expect(Object.keys(props)).toEqual(['engine']);
  });

  it('shows only the task ID for queries after switching from creation', async () => {
    expect(await aiScraperProps.websiteProperties({ operation: 'get_task_result' })).toEqual({});
    const props = await aiScraperProps.requestProperties({ operation: 'get_task_result', website: { engine: 'chatgpt' } });
    expect(Object.keys(props)).toEqual(['task_id']);
    expect(props).toMatchObject({ task_id: { required: true } });
  });

  it.each([
    { engine: 'chatgpt', fields: ['prompt', 'country', 'web_search', 'shopping', 'should_fetch_share_link'] },
    { engine: 'perplexity', fields: ['prompt', 'country', 'web_search', 'should_fetch_share_link'] },
    { engine: 'copilot', fields: ['prompt', 'country', 'mode', 'should_fetch_share_link'] },
    { engine: 'gemini', fields: ['prompt', 'country', 'shopping'] },
    { engine: 'aimode', fields: ['prompt', 'country', 'shopping', 'location', 'uule', 'should_fetch_share_link'] },
    { engine: 'overview', fields: ['prompt', 'country', 'shopping', 'location', 'uule', 'should_fetch_share_link'] },
    { engine: 'grok', fields: ['prompt', 'country', 'mode', 'should_fetch_share_link'] },
    { engine: 'alexa', fields: ['prompt', 'country'] },
  ])('shows only applicable controls for $engine with safe defaults', async ({ engine, fields }) => {
    const props = await aiScraperProps.requestProperties({ operation: 'create_task', website: { engine } });
    expect(Object.keys(props)).toEqual(fields);
    expect(props).toMatchObject({ prompt: { required: true }, country: { required: true, defaultValue: 'US' } });
    if (fields.includes('shopping')) expect(props).toMatchObject({ shopping: { defaultValue: false } });
    if (fields.includes('should_fetch_share_link')) expect(props).toMatchObject({ should_fetch_share_link: { defaultValue: false } });
    if (fields.includes('web_search')) expect(props).toMatchObject({ web_search: { defaultValue: true } });
  });

  it.each([undefined, {}, [], { engine: 'unknown' }, { engine: 'toString' }])('returns no creation controls for an unselected or invalid website: %#', async (website) => {
    expect(await aiScraperProps.requestProperties({ operation: 'create_task', website })).toEqual({});
  });
});
