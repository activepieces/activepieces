import { afterEach, describe, expect, test, vi } from 'vitest';
import { transcribeAudioAction } from '../src/actions/transcribe-audio';
import { listModelsAction } from '../src/actions/list-models';
import { listRequestsAction } from '../src/actions/list-requests';
import { getRequestAction } from '../src/actions/get-request';
import { getUsageAction } from '../src/actions/get-usage';
import { getBalancesAction } from '../src/actions/get-balances';
import { getBillingBreakdownAction } from '../src/actions/get-billing-breakdown';
import { listProjectMembersAction } from '../src/actions/list-project-members';
import { transcribeAudioAiAction } from '../src/actions/ai/transcribe-audio';
import { listModelsAiAction } from '../src/actions/ai/list-models';
import { getModelAction } from '../src/actions/ai/get-model';
import { listRequestsAiAction } from '../src/actions/ai/list-requests';
import { getRequestAiAction } from '../src/actions/ai/get-request';
import { listProjectMembersAiAction } from '../src/actions/ai/list-project-members';
import { getUsageBreakdownAiAction } from '../src/actions/ai/get-usage-breakdown';
import { getUsageSummaryAction } from '../src/actions/ai/get-usage-summary';
import { listUsageFieldsAction } from '../src/actions/ai/list-usage-fields';
import { listBalancesAiAction } from '../src/actions/ai/list-balances';
import { getBalanceAction } from '../src/actions/ai/get-balance';
import { getBillingBreakdownAiAction } from '../src/actions/ai/get-billing-breakdown';
import { listBillingFieldsAction } from '../src/actions/ai/list-billing-fields';
import { listPurchasesAction } from '../src/actions/ai/list-purchases';
import { listThinkModelsAction } from '../src/actions/ai/list-think-models';
import { API_KEY, runAction, stubFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

const API = 'https://api.deepgram.com/v1';
const ONE_PROJECT = { projects: [{ project_id: 'p-1', name: 'Main' }] };

const twinPairs = [
  [transcribeAudioAction, transcribeAudioAiAction, ['model']],
  [listModelsAction, listModelsAiAction, ['project']],
  [listRequestsAction, listRequestsAiAction, ['project']],
  [getRequestAction, getRequestAiAction, ['project']],
  [getUsageAction, getUsageBreakdownAiAction, ['project']],
  [getBalancesAction, listBalancesAiAction, ['project']],
  [getBillingBreakdownAction, getBillingBreakdownAiAction, ['project']],
  [listProjectMembersAction, listProjectMembersAiAction, ['project']],
] as const;

describe('twins', () => {
  test.each(twinPairs)(
    'keep every other prop of the original unchanged',
    (original, twin, swapped) => {
      for (const [key, prop] of Object.entries(original.props)) {
        if (swapped.some((name) => name === key)) {
          continue;
        }
        expect(Reflect.get(twin.props, key), `${twin.name}.${key}`).toBe(prop);
      }
      expect(twin.outputSchema).toBeDefined();
      expect(twin.audience).toBe('ai');
      expect(original.audience).toBe('human');
    }
  );

  test.each(twinPairs.filter(([, , swapped]) => swapped[0] === 'project'))(
    'swap the project dropdown for a ShortText project_id',
    (_original, twin) => {
      expect(Reflect.get(twin.props, 'project')).toBeUndefined();
      expect(Reflect.get(twin.props, 'project_id')?.type).toBe('SHORT_TEXT');
    }
  );

  test('transcribe twin takes model as text and defaults to nova-3', async () => {
    expect(transcribeAudioAiAction.props.model.type).toBe('SHORT_TEXT');
    const seen = stubFetch(() => ({
      body: { metadata: { request_id: 'r-1' }, results: { channels: [] } },
    }));
    await runAction({
      action: transcribeAudioAiAction,
      propsValue: {
        audioUrl: 'https://cdn.test/a.wav',
        model: 'nova-3-general',
      },
    });
    expect(seen[0].url).toBe(
      `${API}/listen?model=nova-3-general&smart_format=true`
    );
    expect(seen[0].json).toEqual({ url: 'https://cdn.test/a.wav' });
    await runAction({
      action: transcribeAudioAiAction,
      propsValue: { audioUrl: 'https://cdn.test/a.wav' },
    });
    expect(seen[1].url).toContain('model=nova-3&');
  });

  test.each([
    [listRequestsAiAction, '/requests?limit=50&page=0', {}],
    [getRequestAiAction, '/requests/req-1', { requestId: 'req-1' }],
    [getUsageBreakdownAiAction, '/usage/breakdown', {}],
    [listBalancesAiAction, '/balances', {}],
    [getBillingBreakdownAiAction, '/billing/breakdown', {}],
    [listProjectMembersAiAction, '/members', {}],
  ] as const)(
    '%s uses the given project ID without listing projects',
    async (action, path, extra) => {
      const seen = stubFetch(() => ({ body: { request_id: 'req-1' } }));
      await runAction({ action, propsValue: { project_id: 'p 9', ...extra } });
      expect(seen.map((request) => request.url)).toEqual([
        `${API}/projects/p%209${path}`,
      ]);
    }
  );

  test('auto-resolves an empty project_id on a single-project key', async () => {
    const seen = stubFetch((request) =>
      request.url.endsWith('/projects')
        ? { body: ONE_PROJECT }
        : { body: { members: [{ member_id: 'm-1', scopes: ['owner'] }] } }
    );
    const result = await runAction({
      action: listProjectMembersAiAction,
      propsValue: { project_id: '' },
    });
    expect(seen.map((request) => request.url)).toEqual([
      `${API}/projects`,
      `${API}/projects/p-1/members`,
    ]);
    expect(result).toEqual({
      members: [
        {
          member_id: 'm-1',
          email: null,
          first_name: null,
          last_name: null,
          scopes: 'owner',
        },
      ],
    });
  });
});

const catalog = {
  stt: [
    {
      name: 'general',
      canonical_name: 'nova-3-general',
      architecture: 'nova-3',
      languages: ['en'],
      version: '2025-01-01.0',
      uuid: 'u-en',
      batch: true,
      streaming: true,
    },
    {
      name: 'general',
      canonical_name: 'nova-3-general',
      architecture: 'nova-3',
      languages: ['gl'],
      version: '2026-10-06.5364',
      uuid: 'u-gl',
      batch: true,
      streaming: true,
    },
  ],
  tts: [
    {
      name: 'thalia',
      canonical_name: 'aura-2-thalia-en',
      architecture: 'aura-2',
      languages: ['en'],
      version: '2025-01-01.0',
      uuid: 'u-thalia',
      metadata: { display_name: 'Thalia', tags: ['feminine'] },
    },
  ],
};

describe('deepgram_list_models', () => {
  test('empty project ID reads the public catalog and never lists projects', async () => {
    const seen = stubFetch(() => ({ body: catalog }));
    const result = await runAction({
      action: listModelsAiAction,
      propsValue: { type: 'stt' },
    });
    expect(seen.map((request) => request.url)).toEqual([`${API}/models`]);
    expect(result).toMatchObject({ count: 1 });
    expect(JSON.stringify(result)).not.toContain('uuid');
  });

  test('perBuild returns one row per build with its UUID', async () => {
    stubFetch(() => ({ body: catalog }));
    const result = await runAction({
      action: listModelsAiAction,
      propsValue: { type: 'all', perBuild: true, language: 'gl' },
    });
    expect(result).toMatchObject({
      count: 1,
      models: [{ uuid: 'u-gl', languages: 'gl' }],
    });
    const all = await runAction({
      action: listModelsAiAction,
      propsValue: { type: 'all', perBuild: true },
    });
    expect(JSON.stringify(all).match(/u-[a-z]+/g)).toEqual([
      'u-en',
      'u-gl',
      'u-thalia',
    ]);
  });

  test('a project ID switches to the project catalog', async () => {
    const seen = stubFetch(() => ({ body: catalog }));
    await runAction({
      action: listModelsAiAction,
      propsValue: { type: 'tts', project_id: 'p-1', includeOutdated: true },
    });
    expect(seen[0].url).toBe(
      `${API}/projects/p-1/models?include_outdated=true`
    );
  });
});

describe('deepgram_get_model', () => {
  test('reads the public build by UUID', async () => {
    const seen = stubFetch(() => ({ body: catalog.stt[1] }));
    const result = await runAction({
      action: getModelAction,
      propsValue: { model_id: ' u-gl ' },
    });
    expect(seen[0].url).toBe(`${API}/models/u-gl`);
    expect(result).toMatchObject({
      uuid: 'u-gl',
      canonical_name: 'nova-3-general',
      type: 'stt',
      languages: 'gl',
      version: '2026-10-06.5364',
      batch: true,
    });
  });

  test('reads a project build and recognises voices', async () => {
    const seen = stubFetch(() => ({ body: catalog.tts[0] }));
    const result = await runAction({
      action: getModelAction,
      propsValue: { model_id: 'u-thalia', project_id: 'p-1' },
    });
    expect(seen[0].url).toBe(`${API}/projects/p-1/models/u-thalia`);
    expect(result).toMatchObject({ type: 'tts', name: 'Thalia', batch: null });
  });

  test('refuses an empty ID before calling Deepgram', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    await expect(
      runAction({ action: getModelAction, propsValue: { model_id: ' ' } })
    ).rejects.toThrow('Enter a model UUID.');
    expect(seen).toEqual([]);
  });
});

describe('usage atomics', () => {
  test('usage summary sends every filter and strips a tag= prefix', async () => {
    const seen = stubFetch(() => ({
      body: {
        start: '2026-10-01',
        end: '2026-10-11',
        resolution: { units: 'day', amount: 1 },
        results: [
          {
            start: '2026-10-11',
            end: '2026-10-11',
            hours: 0.0072,
            total_hours: 0.0072,
            requests: 2,
            tokens: { in: 3, out: 4 },
            tts: { characters: 9, requests: 1 },
          },
        ],
      },
    }));
    const result = await runAction({
      action: getUsageSummaryAction,
      propsValue: {
        project_id: 'p-1',
        start: '2026-10-01T10:00:00Z',
        end: '2026-10-11',
        accessor: 'key-1',
        tag: 'tag=aptest',
        model: 'u-en',
        endpoint: 'listen',
        method: 'sync',
        deployment: 'hosted',
      },
    });
    expect(seen[0].url).toBe(
      `${API}/projects/p-1/usage?start=2026-10-01&end=2026-10-11&accessor=key-1&tag=aptest&model=u-en&endpoint=listen&method=sync&deployment=hosted`
    );
    expect(result).toMatchObject({
      start: '2026-10-01',
      end: '2026-10-11',
      resolution: '1 day',
      total_hours: 0.0072,
      total_requests: 2,
      total_tts_characters: 9,
      total_tts_requests: 1,
      total_tokens_in: 3,
      total_tokens_out: 4,
      results: [
        {
          start: '2026-10-11',
          end: '2026-10-11',
          hours: 0.0072,
          total_hours: 0.0072,
          requests: 2,
          tts_characters: 9,
          tts_requests: 1,
          tokens_in: 3,
          tokens_out: 4,
        },
      ],
    });
  });

  test('usage summary rejects a reversed range', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    await expect(
      runAction({
        action: getUsageSummaryAction,
        propsValue: {
          project_id: 'p-1',
          start: '2026-10-11',
          end: '2026-10-01',
        },
      })
    ).rejects.toThrow('start date');
    expect(seen).toEqual([]);
  });

  test('usage fields flattens models and strips tag= prefixes', async () => {
    const seen = stubFetch(() => ({
      body: {
        accessors: ['key-1'],
        tags: ['tag=dev', 'dev', 'prod'],
        models: [
          { name: 'general', language: 'en', version: 'v1', model_id: 'u-en' },
        ],
        processing_methods: ['sync'],
        features: ['smart_format'],
      },
    }));
    const result = await runAction({
      action: listUsageFieldsAction,
      propsValue: { project_id: 'p-1', start: '2026-10-01' },
    });
    expect(seen[0].url).toBe(
      `${API}/projects/p-1/usage/fields?start=2026-10-01`
    );
    expect(result).toEqual({
      accessors: ['key-1'],
      tags: ['dev', 'prod'],
      models: [
        { model_id: 'u-en', name: 'general', language: 'en', version: 'v1' },
      ],
      processing_methods: ['sync'],
      features: ['smart_format'],
    });
  });
});

describe('billing atomics', () => {
  test('billing fields flattens the line_items map to rows', async () => {
    const seen = stubFetch((request) => ({
      body: request.url.endsWith('/projects')
        ? ONE_PROJECT
        : {
            accessors: ['key-1'],
            deployments: ['hosted'],
            tags: ['dev'],
            line_items: { 'sync::aura': 'Aura TTS', 'async::nova': 'Nova' },
          },
    }));
    const result = await runAction({
      action: listBillingFieldsAction,
      propsValue: {},
    });
    expect(seen[0].url).toBe(`${API}/projects`);
    expect(seen[1].url).toBe(`${API}/projects/p-1/billing/fields`);
    expect(result).toEqual({
      accessors: ['key-1'],
      deployments: ['hosted'],
      tags: ['dev'],
      line_items: [
        { line_item: 'sync::aura', description: 'Aura TTS' },
        { line_item: 'async::nova', description: 'Nova' },
      ],
    });
  });

  test('billing fields tolerates a missing map', async () => {
    stubFetch(() => ({ body: {} }));
    const result = await runAction({
      action: listBillingFieldsAction,
      propsValue: { project_id: 'p-1' },
    });
    expect(result).toEqual({
      accessors: [],
      deployments: [],
      tags: [],
      line_items: [],
    });
  });

  test('purchases sends the limit and flattens orders', async () => {
    const seen = stubFetch(() => ({
      body: {
        orders: [
          {
            order_id: 'o-1',
            expiration: '2027-01-01T00:00:00Z',
            created: '2026-01-01T00:00:00Z',
            amount: 200,
            units: 'usd',
            order_type: 'promotional',
          },
        ],
      },
    }));
    const result = await runAction({
      action: listPurchasesAction,
      propsValue: { project_id: 'p-1', limit: '5' },
    });
    expect(seen[0].url).toBe(`${API}/projects/p-1/purchases?limit=5`);
    expect(result).toEqual({
      orders: [
        {
          order_id: 'o-1',
          created: '2026-01-01T00:00:00Z',
          expiration: '2027-01-01T00:00:00Z',
          amount: 200,
          units: 'usd',
          order_type: 'promotional',
        },
      ],
      count: 1,
    });
  });

  test.each([0, 1001, 2.5, 'abc'])(
    'purchases rejects limit %s before calling Deepgram',
    async (limit) => {
      const seen = stubFetch(() => ({ body: {} }));
      await expect(
        runAction({
          action: listPurchasesAction,
          propsValue: { project_id: 'p-1', limit },
        })
      ).rejects.toThrow('Limit must be a whole number from 1 to 1000.');
      expect(seen).toEqual([]);
    }
  );

  test('purchases defaults to 10', async () => {
    const seen = stubFetch(() => ({ body: { orders: [] } }));
    const result = await runAction({
      action: listPurchasesAction,
      propsValue: { project_id: 'p-1' },
    });
    expect(seen[0].url).toBe(`${API}/projects/p-1/purchases?limit=10`);
    expect(result).toEqual({ orders: [], count: 0 });
  });

  test('get balance reads one balance by ID', async () => {
    const seen = stubFetch(() => ({
      body: { balance_id: 'b-1', amount: 199.5, units: 'usd' },
    }));
    const result = await runAction({
      action: getBalanceAction,
      propsValue: { project_id: 'p-1', balance_id: ' b-1 ' },
    });
    expect(seen[0].url).toBe(`${API}/projects/p-1/balances/b-1`);
    expect(result).toEqual({
      balance_id: 'b-1',
      amount: 199.5,
      units: 'usd',
      purchase_order_id: null,
    });
  });

  test('get balance refuses an empty ID', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    await expect(
      runAction({
        action: getBalanceAction,
        propsValue: { project_id: 'p-1', balance_id: '' },
      })
    ).rejects.toThrow('Enter a balance ID.');
    expect(seen).toEqual([]);
  });

  test('get balance relays a 403 with the role hint', async () => {
    stubFetch(() => ({
      status: 403,
      body: {
        err_code: 'INSUFFICIENT_PERMISSIONS',
        err_msg: 'no billing:read',
      },
    }));
    await expect(
      runAction({
        action: getBalanceAction,
        propsValue: { project_id: 'p-1', balance_id: 'b-1' },
      })
    ).rejects.toThrow(/HTTP 403 INSUFFICIENT_PERMISSIONS.*Admin or Owner/);
  });
});

describe('deepgram_list_think_models', () => {
  test('calls the agent host with the key and flattens models', async () => {
    const seen = stubFetch(() => ({
      body: {
        models: [
          { id: 'gpt-4o-mini', name: 'GPT-4o mini', provider: 'open_ai' },
          { id: 'claude-x', name: 'Claude', provider: 'anthropic' },
        ],
      },
    }));
    const result = await runAction({
      action: listThinkModelsAction,
      propsValue: {},
    });
    expect(seen[0].url).toBe(
      'https://agent.deepgram.com/v1/agent/settings/think/models'
    );
    expect(seen[0].headers.get('authorization')).toBe(`Token ${API_KEY}`);
    expect(result).toEqual({
      models: [
        { id: 'gpt-4o-mini', name: 'GPT-4o mini', provider: 'open_ai' },
        { id: 'claude-x', name: 'Claude', provider: 'anthropic' },
      ],
      count: 2,
    });
  });
});
